import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');
    const repoLink = searchParams.get('github_url');
    const bucketLink = searchParams.get('supabase_bucket');

    console.log('\n========================================');
    console.log('🚀 [GIT-DATA API] Request received');
    console.log('📋 Parameters:', {
      project_id: projectId,
      github_url: repoLink,
      supabase_bucket: bucketLink?.substring(0, 50) + '...',
    });

    if (!repoLink || !bucketLink) {
      console.error('❌ Missing required parameters');
      return NextResponse.json(
        { error: 'repo_link and bucket_link parameters are required' },
        { status: 400 }
      );
    }

    // Parse GitHub URL to extract owner and repo
    const match = repoLink.match(/github\.com\/([^\/]+)\/([^\/\.]+)/);
    if (!match) {
      console.error('❌ Invalid GitHub URL format:', repoLink);
      return NextResponse.json({ error: 'Invalid GitHub URL format' }, { status: 400 });
    }

    const [, owner, repo] = match;
    console.log('🔍 Parsed GitHub:', { owner, repo });

    // Fetch commits from GitHub API
    console.log('⏱️  [1/4] Fetching commits from GitHub API...');
    const githubStartTime = Date.now();

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
      console.error('❌ GitHub API error:', await githubResponse.text());
      return NextResponse.json(
        { error: 'Failed to fetch commits from GitHub' },
        { status: githubResponse.status }
      );
    }

    const githubCommits = await githubResponse.json();
    console.log(`✅ GitHub API: Fetched ${githubCommits.length} commits in ${Date.now() - githubStartTime}ms`);
    console.log('📦 Sample commits (first 3):', githubCommits.slice(0, 3).map((c: any) => ({
      sha: c.sha.substring(0, 7),
      message: c.commit.message.split('\n')[0].substring(0, 50),
    })));

    // Fetch context data from Supabase
    console.log('⏱️  [2/4] Fetching Claude contexts from Supabase...');
    const supabaseStartTime = Date.now();

    const supabase = await createClient();
    const { data: contexts, error: supabaseError } = await supabase
      .from('contexts')
      .select('*')
      .eq('repository_path', repoLink);

    if (supabaseError) {
      console.error('❌ Supabase error:', supabaseError);
      return NextResponse.json(
        { error: 'Failed to fetch context data' },
        { status: 500 }
      );
    }

    console.log(`✅ Supabase: Found ${contexts?.length || 0} contexts in ${Date.now() - supabaseStartTime}ms`);
    if (contexts && contexts.length > 0) {
      console.log('🔗 Contexts found for commits:', contexts.map(c => c.commit_sha.substring(0, 7)));
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

    // Fetch branches from GitHub API
    console.log('⏱️  [3/4] Fetching branches from GitHub API...');
    const branchesStartTime = Date.now();

    const branchesResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/branches?per_page=100`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          ...(process.env.GITHUB_TOKEN && {
            'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`
          })
        },
        next: { revalidate: 300 }
      }
    );

    let branchesData: any[] = [];
    if (branchesResponse.ok) {
      branchesData = await branchesResponse.json();
      console.log(`✅ GitHub API: Fetched ${branchesData.length} branches in ${Date.now() - branchesStartTime}ms`);
      console.log('🌿 Branches found:', branchesData.slice(0, 5).map(b => b.name).join(', ') + (branchesData.length > 5 ? '...' : ''));
    } else {
      console.warn('⚠️  Failed to fetch branches, continuing without branch data');
    }

    // Build commit SHA to branch name mapping
    const branchHeadsMap = new Map<string, string[]>();
    branchesData.forEach(branch => {
      const sha = branch.commit.sha;
      const branchName = branch.name;
      if (!branchHeadsMap.has(sha)) {
        branchHeadsMap.set(sha, []);
      }
      branchHeadsMap.get(sha)!.push(branchName);
    });

    // Extract parent relationships and assign branches
    console.log('  📊 Extracting parent relationships from commit data...');
    const gitStructureMap = new Map<string, { parent_sha: string | null; branches: string[] }>();

    githubCommits.forEach((commit: any, index: number) => {
      // Extract parent_sha from parents array
      const parent_sha = commit.parents && commit.parents.length > 0
        ? commit.parents[0].sha
        : null;

      // Get branches for this commit (if it's a branch HEAD)
      const branches = branchHeadsMap.get(commit.sha) || [];

      gitStructureMap.set(commit.sha, {
        parent_sha,
        branches,
      });

      // Log first 3 examples
      if (index < 3) {
        console.log(`     ${commit.sha.substring(0, 7)} -> ${parent_sha ? parent_sha.substring(0, 7) : 'root'} | branches: [${branches.join(', ')}]`);
      }
    });

    console.log(`  ✅ Structure extraction completed in ${Date.now() - branchesStartTime}ms`);

    // Merge GitHub commits with context data and git structure
    console.log('⏱️  [4/4] Merging data from all sources...');
    const mergeStartTime = Date.now();

    const mergedCommits = githubCommits.map((commit: any) => {
      const gitStructure = gitStructureMap.get(commit.sha);
      return {
        commit_sha: commit.sha,
        commit_sha_short: commit.sha.substring(0, 7),
        commit_message: commit.commit.message,
        author_email: commit.commit.author.email,
        timestamp: commit.commit.author.date,
        parent_sha: gitStructure?.parent_sha || null,
        branches: gitStructure?.branches || [],
        claude_context: contextMap.get(commit.sha) || null,
      };
    });

    console.log(`✅ Data merge completed in ${Date.now() - mergeStartTime}ms`);
    console.log('\n📊 FINAL STATISTICS:');
    console.log('═══════════════════════════════════════');
    console.log(`  Total commits: ${mergedCommits.length}`);
    console.log(`  Commits with parent_sha: ${mergedCommits.filter(c => c.parent_sha).length}`);
    console.log(`  Commits with branches: ${mergedCommits.filter(c => c.branches.length > 0).length}`);
    console.log(`  Commits with Claude context: ${mergedCommits.filter(c => c.claude_context).length}`);

    console.log('\n🔍 Sample merged commits (first 3):');
    mergedCommits.slice(0, 3).forEach((commit, idx) => {
      console.log(`  [${idx + 1}] ${commit.commit_sha_short}:`);
      console.log(`      Message: ${commit.commit_message.split('\n')[0].substring(0, 50)}`);
      console.log(`      Parent: ${commit.parent_sha ? commit.parent_sha.substring(0, 7) : 'none'}`);
      console.log(`      Branches: [${commit.branches.join(', ')}]`);
      console.log(`      Context: ${commit.claude_context ? 'YES' : 'NO'}`);
    });

    const totalTime = Date.now() - startTime;
    console.log(`\n⏱️  TOTAL REQUEST TIME: ${totalTime}ms`);
    console.log('========================================\n');

    return NextResponse.json({ commits: mergedCommits });
  } catch (error) {
    console.error('\n❌ UNEXPECTED ERROR:', error);
    console.error('========================================\n');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
