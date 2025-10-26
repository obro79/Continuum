import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');
    const repoLink = searchParams.get('repo_link');
    const bucketLink = searchParams.get('bucket_link');

    if (!repoLink || !bucketLink) {
      return NextResponse.json(
        { error: 'repo_link and bucket_link parameters are required' },
        { status: 400 }
      );
    }

    // Parse GitHub URL to extract owner and repo
    const match = repoLink.match(/github\.com\/([^\/]+)\/([^\/\.]+)/);
    if (!match) {
      return NextResponse.json({ error: 'Invalid GitHub URL format' }, { status: 400 });
    }

    const [, owner, repo] = match;

    // Fetch commits from GitHub API
    const githubResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/commits?per_page=50`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          ...(process.env.GITHUB_TOKEN && {
            'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`
          })
        },
        next: { revalidate: 300 } // Cache for 5 minutes
      }
    );

    if (!githubResponse.ok) {
      console.error('GitHub API error:', await githubResponse.text());
      return NextResponse.json(
        { error: 'Failed to fetch commits from GitHub' },
        { status: githubResponse.status }
      );
    }

    const githubCommits = await githubResponse.json();

    // Fetch context data from Supabase
    const supabase = await createClient();
    const { data: contexts, error: supabaseError } = await supabase
      .from('contexts')
      .select('*')
      .eq('repository_path', repoLink);

    if (supabaseError) {
      console.error('Supabase error:', supabaseError);
      return NextResponse.json(
        { error: 'Failed to fetch context data' },
        { status: 500 }
      );
    }

    // Create a map of commit_sha to context
    const contextMap = new Map();
    contexts?.forEach((context) => {
      contextMap.set(context.commit_sha, {
        context_id: context.context_id,
        total_messages: context.total_messages,
        new_session: context.session_count > 1,
        jsonl_data: context.jsonl_data
      });
    });

    // Merge GitHub commits with context data
    const mergedCommits = githubCommits.map((commit: any) => ({
      commit_sha: commit.sha,
      commit_sha_short: commit.sha.substring(0, 7),
      commit_message: commit.commit.message,
      author_email: commit.commit.author.email,
      timestamp: commit.commit.author.date,
      claude_context: contextMap.get(commit.sha) || null
    }));

    return NextResponse.json({ commits: mergedCommits });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
