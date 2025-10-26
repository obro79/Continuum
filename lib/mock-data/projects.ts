export interface Project {
  id: string;
  name: string;
  github_link: string;
  bucket_url: string;
  created_at: string;
}

export const mockProjects: Project[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    name: 'Continuum Dashboard',
    github_link: 'https://github.com/obro79/continuum',
    bucket_url: 'continuum-contexts',
    created_at: '2025-01-21T14:30:00Z'
  }
];
