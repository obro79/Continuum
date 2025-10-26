import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
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

    // Fetch projects where user is owner or member
    const { data: projects, error: fetchError } = await supabase
      .from("projects")
      .select(`
        project_id,
        user_id,
        github_url,
        bucket_name,
        bucket_url,
        created_at,
        project_members!inner(
          user_id,
          role
        )
      `)
      .or(`user_id.eq.${user.id},project_members.user_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (fetchError) {
      console.error("Failed to fetch projects:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch projects" },
        { status: 500 }
      );
    }

    // Transform the data to include role information
    const projectsWithRole = projects?.map((project) => {
      const isOwner = project.user_id === user.id;
      const memberRole = project.project_members?.find(
        (m: { user_id: string }) => m.user_id === user.id
      )?.role;

      return {
        project_id: project.project_id,
        github_url: project.github_url,
        bucket_name: project.bucket_name,
        bucket_url: project.bucket_url,
        created_at: project.created_at,
        is_owner: isOwner,
        role: isOwner ? "owner" : memberRole,
      };
    });

    return NextResponse.json({
      success: true,
      projects: projectsWithRole || [],
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    // Check if user is the owner
    const { data: project, error: fetchError } = await supabase
      .from("projects")
      .select("user_id, bucket_name")
      .eq("project_id", projectId)
      .single();

    if (fetchError || !project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    if (project.user_id !== user.id) {
      return NextResponse.json(
        { error: "Only the project owner can delete this project" },
        { status: 403 }
      );
    }

    // Delete the project (cascade will delete project_members)
    const { error: deleteError } = await supabase
      .from("projects")
      .delete()
      .eq("project_id", projectId);

    if (deleteError) {
      console.error("Failed to delete project:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete project" },
        { status: 500 }
      );
    }

    // Optionally delete the bucket (commented out for safety)
    // You may want to keep the bucket or handle this separately
    /*
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    await fetch(`${supabaseUrl}/storage/v1/bucket/${project.bucket_name}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
      },
    });
    */

    return NextResponse.json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
