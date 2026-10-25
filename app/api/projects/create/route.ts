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
    const bucketName = sanitizeGithubUrlToBucketName(normalizedUrl);
    const bucketUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucketName}`;

    // Insert the project. The storage bucket is created by a database trigger
    // (see supabase/migrations), so no privileged server-side key is needed
    // here - RLS policies scope the insert to the signed-in owner.
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
      // github_url and bucket_name are unique; a duplicate is a user-facing conflict
      if (insertError.code === "23505") {
        return NextResponse.json(
          { error: "Project with this GitHub URL already exists" },
          { status: 409 }
        );
      }

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
