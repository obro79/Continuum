import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { mockProjects } from '@/lib/mock-data/projects';

export async function GET() {
  try {
    const supabase = await createClient();

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('Error fetching user:', userError);
      console.log('User not authenticated, using mock data');
      return NextResponse.json({ projects: mockProjects });
    }

    // Fetch projects for the authenticated user
    const { data: projects, error } = await supabase
      .from('projects')
      .select('project_id, user_id, github_url, bucket_name, bucket_url, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
      console.log('Using mock data instead');
      return NextResponse.json({ projects: mockProjects });
    }

    // If no projects found, return mock data
    if (!projects || projects.length === 0) {
      console.log('No projects found in database, using mock data');
      return NextResponse.json({ projects: mockProjects });
    }

    // Transform to match the expected format
    const transformedProjects = projects.map(p => ({
      id: p.project_id,
      name: p.github_url?.split('/').pop() || 'Unknown Project', // Extract repo name from URL
      repo_link: p.github_url,
      bucket_link: p.bucket_url || p.bucket_name,
      created_at: p.created_at
    }));

    return NextResponse.json({ projects: transformedProjects });
  } catch (error) {
    console.error('Unexpected error:', error);
    console.log('Using mock data due to error');
    return NextResponse.json({ projects: mockProjects });
  }
}
