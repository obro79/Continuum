import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface GitCommitDetail {
  commit_sha: string;
  commit_sha_short: string;
  commit_message: string;
  commit_body: string;
  author_email: string;
  author_name: string;
  committer_email: string;
  committer_name: string;
  author_date: string;
  commit_date: string;
  parent_shas: string[];
  tree_sha: string;
  stats: {
    files_changed: number;
    insertions: number;
    deletions: number;
  };
  files: Array<{
    filename: string;
    status: string;
    additions: number;
    deletions: number;
  }>;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sha: string }> }
) {
  try {
    const { sha } = await params;

    // Validate SHA format (basic validation)
    if (!sha || !/^[a-f0-9]{7,40}$/i.test(sha)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid commit SHA format',
        },
        { status: 400 }
      );
    }

    // Get commit details using git show
    const detailCommand = `git show --format='%H|%h|%s|%b|%ae|%an|%ce|%cn|%aI|%cI|%P|%T' --no-patch ${sha}`;

    const { stdout: detailOutput, stderr: detailStderr } = await execAsync(detailCommand, {
      cwd: process.cwd(),
    });

    if (detailStderr && !detailStderr.includes('warning')) {
      console.error('Git show stderr:', detailStderr);
      return NextResponse.json(
        {
          success: false,
          error: 'Commit not found',
        },
        { status: 404 }
      );
    }

    // Parse commit details
    const lines = detailOutput.trim().split('\n');
    const detailLine = lines[0].replace(/^'|'$/g, '');
    const [
      fullSha,
      shortSha,
      subject,
      body,
      authorEmail,
      authorName,
      committerEmail,
      committerName,
      authorDate,
      commitDate,
      parentShas,
      treeSha,
    ] = detailLine.split('|');

    // Get file statistics
    const statsCommand = `git show --stat --format='' ${sha}`;
    const { stdout: statsOutput } = await execAsync(statsCommand, {
      cwd: process.cwd(),
    });

    // Parse stats summary (last line of --stat output)
    const statsLines = statsOutput.trim().split('\n').filter(line => line);
    let filesChanged = '0';
    let insertions = '0';
    let deletions = '0';

    if (statsLines.length > 0) {
      const summaryLine = statsLines[statsLines.length - 1];
      filesChanged = summaryLine?.match(/(\d+) file/)?.[1] || '0';
      insertions = summaryLine?.match(/(\d+) insertion/)?.[1] || '0';
      deletions = summaryLine?.match(/(\d+) deletion/)?.[1] || '0';
    }

    // Get detailed file changes
    const filesCommand = `git show --numstat --format='' ${sha}`;
    const { stdout: filesOutput } = await execAsync(filesCommand, {
      cwd: process.cwd(),
    });

    const files = filesOutput
      .trim()
      .split('\n')
      .filter(line => line)
      .map(line => {
        const [additions, deletions, filename] = line.split('\t');

        // Determine file status
        let status = 'modified';
        if (additions === '-' && deletions === '-') {
          status = 'binary';
        } else if (parseInt(additions) > 0 && parseInt(deletions) === 0) {
          status = 'added';
        } else if (parseInt(additions) === 0 && parseInt(deletions) > 0) {
          status = 'deleted';
        }

        return {
          filename,
          status,
          additions: additions === '-' ? 0 : parseInt(additions),
          deletions: deletions === '-' ? 0 : parseInt(deletions),
        };
      });

    const commitDetail: GitCommitDetail = {
      commit_sha: fullSha,
      commit_sha_short: shortSha,
      commit_message: subject,
      commit_body: body || '',
      author_email: authorEmail,
      author_name: authorName,
      committer_email: committerEmail,
      committer_name: committerName,
      author_date: authorDate,
      commit_date: commitDate,
      parent_shas: parentShas ? parentShas.split(' ') : [],
      tree_sha: treeSha,
      stats: {
        files_changed: parseInt(filesChanged),
        insertions: parseInt(insertions),
        deletions: parseInt(deletions),
      },
      files,
    };

    return NextResponse.json({
      success: true,
      data: commitDetail,
    });

  } catch (error) {
    console.error('Error fetching commit details:', error);

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
        error: 'Failed to fetch commit details',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}