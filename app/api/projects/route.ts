import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Get the authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("Error fetching user:", userError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch projects owned by the authenticated user (RLS scopes this to the owner)
    const { data: projects, error } = await supabase
      .from("projects")
      .select("project_id, user_id, github_url, bucket_name, bucket_url, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching projects:", error);
      return NextResponse.json(
        { error: "Failed to load projects", projects: [] },
        { status: 500 }
      );
    }

    // Transform to match the expected format. An empty database returns an
    // honest empty list - the dashboard renders its empty state.
    const transformedProjects = (projects ?? []).map((p) => ({
      project_id: p.project_id,
      github_url: p.github_url,
      bucket_name: p.bucket_name,
      bucket_url: p.bucket_url,
      created_at: p.created_at,
      is_owner: true, // RLS only exposes projects the signed-in user owns
      role: "owner",
    }));

    return NextResponse.json({ projects: transformedProjects });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error", projects: [] },
      { status: 500 }
    );
  }
}
