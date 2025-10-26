# Supabase Schema - MVP

Minimal schema for Claude Code context visualization with public read access.

## Schema

### Users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Contexts
```sql
CREATE TABLE contexts (
  context_id TEXT PRIMARY KEY,
  repository_path TEXT NOT NULL,
  repository_name TEXT,
  commit_sha TEXT NOT NULL,
  parent_commit_sha TEXT,
  author_email TEXT,
  total_messages INTEGER,
  session_count INTEGER,
  new_messages_since_parent INTEGER,
  jsonl_data TEXT NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Projects
```sql
CREATE TABLE projects (
  project_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  github_url TEXT NOT NULL UNIQUE,
  bucket_name TEXT NOT NULL UNIQUE,
  bucket_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Project Members
```sql
CREATE TABLE project_members (
  project_id UUID NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'member')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (project_id, user_id)
);
```

## Complete Migration

Copy-paste this into Supabase SQL Editor:

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contexts table
CREATE TABLE contexts (
  context_id TEXT PRIMARY KEY,
  repository_path TEXT NOT NULL,
  repository_name TEXT,
  commit_sha TEXT NOT NULL,
  parent_commit_sha TEXT,
  author_email TEXT,
  total_messages INTEGER,
  session_count INTEGER,
  new_messages_since_parent INTEGER,
  jsonl_data TEXT NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects table
CREATE TABLE projects (
  project_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  github_url TEXT NOT NULL UNIQUE,
  bucket_name TEXT NOT NULL UNIQUE,
  bucket_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project Members table
CREATE TABLE project_members (
  project_id UUID NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'member')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (project_id, user_id)
);

-- Indexes
CREATE INDEX idx_contexts_commit_sha ON contexts(commit_sha);
CREATE INDEX idx_contexts_repository_path ON contexts(repository_path);
CREATE INDEX idx_contexts_author_email ON contexts(author_email);
CREATE INDEX idx_contexts_created_at ON contexts(created_at DESC);
CREATE INDEX idx_contexts_created_by ON contexts(created_by);
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_github_url ON projects(github_url);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX idx_project_members_user_id ON project_members(user_id);
CREATE INDEX idx_project_members_project_id ON project_members(project_id);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Contexts policies (public read for authenticated users)
CREATE POLICY "Public read for authenticated users"
  ON contexts FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert contexts"
  ON contexts FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete own contexts"
  ON contexts FOR DELETE
  USING (auth.uid() = created_by);

-- Projects policies
CREATE POLICY "Users can read projects they own or are members of"
  ON projects FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = projects.project_id
      AND project_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Only owners can delete projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);

-- Project Members policies
CREATE POLICY "Users can read members of their projects"
  ON project_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.project_id = project_members.project_id
      AND (projects.user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM project_members pm
        WHERE pm.project_id = projects.project_id
        AND pm.user_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Project owners can add members"
  ON project_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.project_id = project_members.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Project owners can remove members"
  ON project_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.project_id = project_members.project_id
      AND projects.user_id = auth.uid()
    )
  );
```

## Notes

- Any authenticated user can read all contexts
- Users can only insert/delete their own contexts
- Users can read projects they own or are members of
- Only project owners can delete projects and manage members
- Project members get read and write access to the associated Supabase bucket
- Fetch Git commit data via GitHub API using `commit_sha`
