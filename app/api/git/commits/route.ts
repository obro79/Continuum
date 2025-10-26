import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface GitCommit {
  commit_sha: string;
  commit_sha_short: string;
  commit_message: string;
  author_email: string;
  author_name: string;
  timestamp: string;
  parent_sha: string | null;
  branches?: string[]; // branches that contain this commit
}

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get('limit') || '50';
    const branch = searchParams.get('branch') || 'HEAD';
    const allBranches = searchParams.get('all') === 'true';

    // Validate limit
    const safeLimit = Math.min(1000, Math.max(1, parseInt(limit)));

    // Execute git log command with specific format
    let gitCommand: string;
    if (allBranches) {
      // Fetch from all branches
      gitCommand = `git log --all --format='%H|%h|%s|%ae|%an|%aI|%P' -n ${safeLimit}`;
    } else {
      gitCommand = `git log --format='%H|%h|%s|%ae|%an|%aI|%P' -n ${safeLimit} ${branch}`;
    }

    const { stdout, stderr } = await execAsync(gitCommand, {
      cwd: process.cwd(),
    });

    if (stderr && !stderr.includes('warning')) {
      console.error('Git command stderr:', stderr);
    }

    // Parse the git log output
    const commits: GitCommit[] = stdout
      .trim()
      .split('\n')
      .filter(line => line.length > 0)
      .map(line => {
        // Remove quotes if present
        const cleanLine = line.replace(/^'|'$/g, '');
        const [sha, shortSha, message, email, name, timestamp, parentSha] = cleanLine.split('|');

        return {
          commit_sha: sha,
          commit_sha_short: shortSha,
          commit_message: message,
          author_email: email,
          author_name: name,
          timestamp: timestamp,
          parent_sha: parentSha || null,
        };
      });

    // If fetching all branches, add branch information to each commit
    if (allBranches) {
      // Get branches for each commit
      for (const commit of commits) {
        try {
          const branchCommand = `git branch -r --contains ${commit.commit_sha}`;
          const { stdout: branchOutput } = await execAsync(branchCommand, {
            cwd: process.cwd(),
          });

          commit.branches = branchOutput
            .trim()
            .split('\n')
            .filter(line => line.length > 0)
            .map(branch => branch.trim().replace('origin/', ''));
        } catch {
          commit.branches = [];
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: commits,
      count: commits.length,
      allBranches: allBranches,
    });

  } catch (error) {
    console.error('Error fetching git commits:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch git commits',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}