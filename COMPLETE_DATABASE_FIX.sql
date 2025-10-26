-- COMPLETE DATABASE FIX
-- This script fixes all issues and sets up the database correctly
-- Run this ONCE in your Supabase SQL Editor

-- ============================================================================
-- STEP 1: Drop all existing policies and tables to start fresh
-- ============================================================================

DROP POLICY IF EXISTS "Users can read members of their projects" ON project_members;
DROP POLICY IF EXISTS "Project owners can add members" ON project_members;
DROP POLICY IF EXISTS "Project owners can remove members" ON project_members;
DROP POLICY IF EXISTS "Users can read projects they own or are members of" ON projects;
DROP POLICY IF EXISTS "Users can insert own projects" ON projects;
DROP POLICY IF EXISTS "Only owners can delete projects" ON projects;
DROP POLICY IF EXISTS "Users can delete own contexts" ON contexts;
DROP POLICY IF EXISTS "Users can insert contexts" ON contexts;
DROP POLICY IF EXISTS "Public read for authenticated users" ON contexts;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can read own profile" ON users;

DROP FUNCTION IF EXISTS is_project_member(UUID, UUID);
DROP FUNCTION IF EXISTS handle_new_user();

DROP TABLE IF EXISTS project_members CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS contexts CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================================
-- STEP 2: Create tables with correct schema
-- ============================================================================

-- Users table (synced with auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
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
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
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

-- ============================================================================
-- STEP 3: Create indexes
-- ============================================================================

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

-- ============================================================================
-- STEP 4: Create trigger to auto-sync auth.users to users table
-- ============================================================================

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger that fires when a new user is created in auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- STEP 5: Backfill existing auth users into users table
-- ============================================================================

INSERT INTO public.users (id, email, display_name, created_at)
SELECT
  id,
  email,
  COALESCE(raw_user_meta_data->>'display_name', email),
  created_at
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STEP 6: Create helper function to avoid RLS recursion
-- ============================================================================

CREATE OR REPLACE FUNCTION is_project_member(project_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM project_members
    WHERE project_id = project_uuid
    AND user_id = user_uuid
  );
$$;

-- ============================================================================
-- STEP 7: Enable Row Level Security
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 8: Create RLS Policies
-- ============================================================================

-- Users policies
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Contexts policies
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
    is_project_member(project_id, auth.uid())
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
      AND projects.user_id = auth.uid()
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

-- ============================================================================
-- Done! Your database is now properly configured.
-- ============================================================================
