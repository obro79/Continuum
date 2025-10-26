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

    // Fetch projects where user is either owner or member
    // Using a join through project_members table
    const { data: memberProjects, error: memberError } = await supabase
      .from('project_members')
      .select(`
        project_id,
        projects (
          id,
          name,
          description,
          repo_link,
          bucket_link,
          created_at
        )
      `)
      .eq('user_id', user.id);

    if (memberError) {
      console.error('Error fetching member projects:', memberError);
      console.log('Using mock data instead');
      return NextResponse.json({ projects: mockProjects });
    }

    // Also fetch projects where user is the owner
    const { data: ownedProjects, error: ownerError } = await supabase
      .from('projects')
      .select('id, name, description, repo_link, bucket_link, created_at')
      .eq('owner_id', user.id);

    if (ownerError) {
      console.error('Error fetching owned projects:', ownerError);
    }

    // Combine and deduplicate projects
    const allProjects = new Map();

    // Add owned projects
    ownedProjects?.forEach(project => {
      allProjects.set(project.id, project);
    });

    // Add member projects
    memberProjects?.forEach(mp => {
      if (mp.projects) {
        allProjects.set(mp.projects.id, mp.projects);
      }
    });

    const projects = Array.from(allProjects.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    // If no projects found, return mock data
    if (projects.length === 0) {
      console.log('No projects found in database, using mock data');
      return NextResponse.json({ projects: mockProjects });
    }

    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Unexpected error:', error);
    console.log('Using mock data due to error');
    return NextResponse.json({ projects: mockProjects });
  }
}
