import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { promises as fs } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Mock context data for cc-sync project (for testing without real bundle)
const MOCK_CC_SYNC_CONTEXTS: Record<string, any> = {
  // Commit 1 - New session (branch from git)
  '137402a3100db4eb5267d07f2ddf2491b0066b15': {
    context_id: 'ctx-137402a3',
    total_messages: 45,
    new_session: true,
    bundle_sha: 'mock-bundle-1'
  },
  // Commit 2 - Continuation (vertical line)
  '854d63a76e0b6a8989cb3f12fda8a05d89d40733': {
    context_id: 'ctx-137402a3', // Same context ID = continuation
    total_messages: 68,
    new_session: false,
    bundle_sha: 'mock-bundle-2'
  },
  // Commit 3 - Continuation (vertical line)
  'de14f2841b1aa99da69a0bf3698e9460110fae5f': {
    context_id: 'ctx-50cb844e', // Continues session 2
    total_messages: 92,
    new_session: false,
    bundle_sha: 'mock-bundle-3'
  },
  // Commit 4 - New session (branch from git)
  '50cb844e4e4dc2a495c2b7a98297e418f95e75a3': {
    context_id: 'ctx-50cb844e', // Starts session 2
    total_messages: 12,
    new_session: true,
    bundle_sha: 'mock-bundle-4'
  },
  // Commit 5 - Continuation (vertical line)
  'bee2782e4616641fade04bf11ba52cb334e2b1c3': {
    context_id: 'ctx-e698da2c', // Continues session 3
    total_messages: 34,
    new_session: false,
    bundle_sha: 'mock-bundle-5'
  },
  // Commit 6 - New session (branch from git)
  'e698da2c2e3f4caa73987dae0c0fae5126af55f6': {
    context_id: 'ctx-e698da2c', // Starts session 3
    total_messages: 78,
    new_session: true,
    bundle_sha: 'mock-bundle-6'
  },
  // Commit 7 - New session (branch from git)
  '310437aa9ea5cd9b9ee32fc4cba6b8d9a1294802': {
    context_id: 'ctx-310437aa',
    total_messages: 156,
    new_session: true,
    bundle_sha: 'mock-bundle-7'
  },
  // Commit 8 - Continuation (vertical line)
  '2a1df093879da89e4486e8e941433243f962222e': {
    context_id: 'ctx-310437aa', // Same context ID = continuation
    total_messages: 203,
    new_session: false,
    bundle_sha: 'mock-bundle-8'
  },
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ project_id: string }> }
) {
  let tempDir: string | null = null;

  try {
    console.log("🚀 Bundle-mapping route called");
    const supabase = await createClient();
    const { project_id } = await params;
    console.log(`📦 Project ID: ${project_id}`);

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

    // Check if this is cc-sync project - return mock data for testing
    if (project.bucket_name === 'cc-sync-contexts' ||
        project.bucket_name.includes('cc-sync')) {
      console.log('🎭 Using mock context data for cc-sync project');
      console.log(`📊 Mock contexts: ${Object.keys(MOCK_CC_SYNC_CONTEXTS).length} commits with contexts`);

      return NextResponse.json({
        success: true,
        shaMap: {}, // Not needed for frontend merge
        contexts: MOCK_CC_SYNC_CONTEXTS,
      });
    }

    // Create service role client for storage access
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const serviceClient = createServiceClient(supabaseUrl, serviceRoleKey);

    // TEMPORARY: Using hardcoded local bundle file
    const bundlePath = "/Users/owenfisher/WebstormProjects/CCC/repo.bundle";
    console.log(`🔧 Using hardcoded bundle: ${bundlePath}`);

    // Create temp dir for git operations
    tempDir = join(tmpdir(), `bundle-${project_id}-${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });
    console.log(`📂 Created temp directory: ${tempDir}`);

    // Initialize a git repo and unbundle the file
    console.log(`🔄 Initializing git repo and unbundling...`);
    await execAsync(`git init`, { cwd: tempDir });
    await execAsync(`git bundle unbundle ${bundlePath}`, { cwd: tempDir });

    // Fetch all refs from the bundle
    await execAsync(`git fetch ${bundlePath} '*:*'`, { cwd: tempDir });

    // Parse git log from unbundled repo
    const gitCommand = `git log --all --pretty=format:"%H %s"`;
    console.log(`🔍 Running git command: ${gitCommand}`);

    const { stdout } = await execAsync(
      gitCommand,
      { cwd: tempDir }
    );

    console.log(`📄 Git log raw output:\n${stdout}`);
    console.log(`📊 Output length: ${stdout.length} characters`);

    // Parse SHA mappings and extract context data
    const shaMap: Record<string, string> = {};
    const contextMap: Record<string, any> = {};
    const lines = stdout.trim().split("\n");
    console.log(`📝 Processing ${lines.length} commit lines`);

    // Track context IDs for session continuity
    const seenContextIds = new Set<string>();

    for (const line of lines) {
      if (!line.trim()) continue;
      console.log(`\n🔄 Processing line: "${line}"`);

      // Parse the commit line
      const parts = line.trim().split(/\s+/);
      const bundleSha = parts[0];

      // Check for the standard format: "Context for main repo commit <SHA>"
      let mainRepoSha: string | null = null;

      // Try to extract SHA from commit message
      const messageMatch = line.match(/Context for main repo commit ([a-f0-9]{40})/);
      if (messageMatch) {
        mainRepoSha = messageMatch[1];
        console.log(`  ✅ Extracted main repo SHA from message: ${mainRepoSha.substring(0, 7)}`);
      } else {
        // If no standard format, skip this commit
        console.log(`  ⚠️ Non-standard commit message format, skipping`);
        continue;
      }

      console.log(`  Bundle SHA: ${bundleSha}`);
      console.log(`  Main repo SHA: ${mainRepoSha}`);

      shaMap[mainRepoSha] = bundleSha;

      try {
        // Extract the JSONL file from the bundle commit
        console.log(`  🌲 Listing files in commit ${bundleSha}...`);
        const { stdout: fileList } = await execAsync(
          `git ls-tree -r ${bundleSha} --name-only`,
          { cwd: tempDir }
        );
        console.log(`  📁 Files found:\n${fileList.split('\n').map(f => `    - ${f}`).join('\n')}`);

        // Look for JSONL files in the commit
        const jsonlFiles = fileList.trim().split('\n').filter(f => f.endsWith('.jsonl'));
        console.log(`  📋 JSONL files found: ${jsonlFiles.length}`);

        if (jsonlFiles.length > 0) {
          console.log(`  📖 Reading JSONL file: ${jsonlFiles[0]}`);
          // Get the content of the first JSONL file
          const { stdout: jsonlContent } = await execAsync(
            `git show ${bundleSha}:${jsonlFiles[0]}`,
            { cwd: tempDir }
          );

          // Parse JSONL to count messages and extract context ID
          const messages = jsonlContent.trim().split('\n')
            .filter(line => line.trim())
            .map(line => {
              try {
                return JSON.parse(line);
              } catch {
                return null;
              }
            })
            .filter(msg => msg !== null);

          // Generate context ID from bundle SHA (or extract from JSONL if available)
          const contextId = `ctx-${bundleSha.substring(0, 8)}`;

          // Determine if this is a new session
          const isNewSession = !seenContextIds.has(contextId);
          seenContextIds.add(contextId);

          contextMap[mainRepoSha] = {
            context_id: contextId,
            total_messages: messages.length,
            new_session: isNewSession,
            bundle_sha: bundleSha,
          };

          console.log(`📝 Found context for ${mainRepoSha.substring(0, 7)}: ${messages.length} messages`);
        }
      } catch (error) {
        console.warn(`⚠️ Failed to extract JSONL for ${bundleSha}:`, error);
      }
    }

    // Cleanup temporary files
    await fs.rm(tempDir, { recursive: true, force: true });
    tempDir = null;

    console.log("\n✅ Bundle processing complete!");
    console.log(`📊 Final results:`);
    console.log(`  - SHA mappings: ${Object.keys(shaMap).length}`);
    console.log(`  - Contexts found: ${Object.keys(contextMap).length}`);
    console.log(`  - SHA map:`, JSON.stringify(shaMap, null, 2));
    console.log(`  - Context map:`, JSON.stringify(contextMap, null, 2));

    return NextResponse.json({
      success: true,
      shaMap,
      contexts: contextMap,
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
