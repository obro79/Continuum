import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateGithubUrl, normalizeGithubUrl } from "@/lib/utils/validate-github-url";
import { sanitizeGithubUrlToBucketName } from "@/lib/utils/sanitize-github-url";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { githubUrl } = body;

    // Validate GitHub URL
    if (!githubUrl || !validateGithubUrl(githubUrl)) {
      return NextResponse.json(
        { error: "Invalid GitHub URL" },
        { status: 400 }
      );
    }

    const normalizedUrl = normalizeGithubUrl(githubUrl);

    // Check if project already exists
    const { data: existingProject } = await supabase
      .from("projects")
      .select("project_id")
      .eq("github_url", normalizedUrl)
      .single();

    if (existingProject) {
      return NextResponse.json(
        { error: "Project with this GitHub URL already exists" },
        { status: 409 }
      );
    }

    // Generate bucket name
    const bucketName = sanitizeGithubUrlToBucketName(normalizedUrl);

    // Create Supabase storage bucket using Admin API
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!serviceRoleKey) {
      console.error("SUPABASE_SERVICE_ROLE_KEY is not set");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Create the bucket
    const bucketResponse = await fetch(
      `${supabaseUrl}/storage/v1/bucket`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceRoleKey}`,
          apikey: serviceRoleKey,
        },
        body: JSON.stringify({
          name: bucketName,
          public: false,
          file_size_limit: 52428800, // 50MB
          allowed_mime_types: null,
        }),
      }
    );

    if (!bucketResponse.ok) {
      const errorData = await bucketResponse.json();
      console.error("Failed to create bucket:", errorData);

      // Check if bucket already exists
      if (errorData.message?.includes("already exists")) {
        // Continue with existing bucket
        console.log("Bucket already exists, continuing...");
      } else {
        return NextResponse.json(
          { error: "Failed to create storage bucket" },
          { status: 500 }
        );
      }
    }

    // Construct bucket URL
    const bucketUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}`;

    // Insert project into database
    const { data: project, error: insertError } = await supabase
      .from("projects")
      .insert({
        user_id: user.id,
        github_url: normalizedUrl,
        bucket_name: bucketName,
        bucket_url: bucketUrl,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Failed to insert project:", insertError);
      return NextResponse.json(
        { error: "Failed to create project" },
        { status: 500 }
      );
    }

    // Add owner to project_members table
    const { error: memberError } = await supabase
      .from("project_members")
      .insert({
        project_id: project.project_id,
        user_id: user.id,
        role: "owner",
      });

    if (memberError) {
      console.error("Failed to add project owner:", memberError);
      // Note: Project is created but owner relation failed
      // Could rollback here if needed
    }

    return NextResponse.json({
      success: true,
      project,
    });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
