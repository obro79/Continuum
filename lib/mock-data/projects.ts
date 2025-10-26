export interface Project {
  project_id: string;
  user_id: string;
  github_url: string;
  bucket_name: string;
  bucket_url: string;
  created_at: string;
}

export const mockProjects: Project[] = [
  {
    project_id: '550e8400-e29b-41d4-a716-446655440002',
    user_id: 'user-123',
    github_url: 'https://github.com/obro79/continuum',
    bucket_name: 'continuum-contexts',
    bucket_url: 'continuum-contexts',
    created_at: '2025-01-21T14:30:00Z'
  }
];
