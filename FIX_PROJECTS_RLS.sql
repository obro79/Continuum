-- Fix infinite recursion in projects RLS policy
-- The issue: projects policy checks project_members, which checks projects = circular dependency
-- Solution: Use security definer function to break the recursion

-- Drop existing problematic policy
DROP POLICY IF EXISTS "Users can read projects they own or are members of" ON projects;

-- Create a security definer function to check membership without recursion
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

-- Recreate the projects SELECT policy using the function
CREATE POLICY "Users can read projects they own or are members of"
  ON projects FOR SELECT
  USING (
    auth.uid() = user_id OR
    is_project_member(project_id, auth.uid())
  );
