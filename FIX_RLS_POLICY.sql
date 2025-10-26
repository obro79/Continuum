-- Fix infinite recursion in project_members RLS policy
-- Run this in your Supabase SQL Editor

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can read members of their projects" ON project_members;

-- Recreate with simplified logic (only owners can view members)
CREATE POLICY "Users can read members of their projects"
  ON project_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.project_id = project_members.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Note: This means only project owners can see the members list.
-- This avoids recursion and is a reasonable security model.
-- Members can still see the project via the projects table RLS.
