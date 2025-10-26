import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { promises as fs } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ project_id: string }> }
) {
  let tempDir: string | null = null;

  try {
    const supabase = await createClient();
    const { project_id } = await params;

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch project from database (RLS will ensure user has access)
    const { data: project, error: fetchError } = await supabase
      .from("projects")
      .select("bucket_name")
      .eq("project_id", project_id)
      .single();

    if (fetchError || !project) {
      return NextResponse.json(
        { error: "Project not found or access denied" },
        { status: 404 }
      );
    }

    // Create service role client for storage access
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const serviceClient = createServiceClient(supabaseUrl, serviceRoleKey);

    // Download repo.bundle from Supabase Storage
    const { data: bundleData, error: downloadError } = await serviceClient
      .storage
      .from(project.bucket_name)
      .download("repo.bundle");

    if (downloadError || !bundleData) {
      return NextResponse.json(
        { error: "Failed to download bundle from storage" },
        { status: 500 }
      );
    }

    // Create temporary directory and save bundle
    tempDir = join(tmpdir(), `bundle-${project_id}-${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });

    const bundlePath = join(tempDir, "repo.bundle");
    const arrayBuffer = await bundleData.arrayBuffer();
    await fs.writeFile(bundlePath, Buffer.from(arrayBuffer));

    // Parse git log from bundle
    const { stdout } = await execAsync(
      `git log --all --pretty=format:"%H %s"`,
      { cwd: tempDir, env: { ...process.env, GIT_DIR: bundlePath } }
    );

    // Parse SHA mappings
    const shaMap: Record<string, string> = {};
    const lines = stdout.trim().split("\n");

    for (const line of lines) {
      if (!line.trim()) continue;

      // Format: "<bundle_sha> Context for main repo commit <main_repo_sha>"
      const parts = line.trim().split(/\s+/);
      const bundleSha = parts[0];
      const mainRepoSha = parts[parts.length - 1]; // Last token is the main repo SHA

      shaMap[mainRepoSha] = bundleSha;
    }

    // Cleanup temporary files
    await fs.rm(tempDir, { recursive: true, force: true });
    tempDir = null;

    return NextResponse.json({
      success: true,
      shaMap,
    });
  } catch (error) {
    console.error("Error processing bundle:", error);

    // Cleanup on error
    if (tempDir) {
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch (cleanupError) {
        console.error("Failed to cleanup temp directory:", cleanupError);
      }
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
