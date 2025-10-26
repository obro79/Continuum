import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sha: string }> }
) {
  try {
    const { sha } = await params;

    // Validate SHA format
    if (!sha || !/^[a-f0-9]{7,40}$/i.test(sha)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid commit SHA format',
        },
        { status: 400 }
      );
    }

    // Get the raw diff
    const diffCommand = `git diff-tree -p ${sha}`;

    const { stdout: diffOutput, stderr: diffStderr } = await execAsync(diffCommand, {
      cwd: process.cwd(),
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large diffs
    });

    if (diffStderr && !diffStderr.includes('warning')) {
      console.error('Git diff stderr:', diffStderr);
    }

    // Get summary statistics
    const statCommand = `git diff-tree --stat ${sha}`;
    const { stdout: statOutput } = await execAsync(statCommand, {
      cwd: process.cwd(),
    });

    return NextResponse.json({
      success: true,
      data: {
        commit_sha: sha,
        diff: diffOutput,
        stats: statOutput,
      },
    });

  } catch (error) {
    console.error('Error fetching diff:', error);

    if (error instanceof Error && error.message.includes('unknown revision')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Commit not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch diff',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}