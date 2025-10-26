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

-- Indexes
CREATE INDEX idx_contexts_commit_sha ON contexts(commit_sha);
CREATE INDEX idx_contexts_repository_path ON contexts(repository_path);
CREATE INDEX idx_contexts_author_email ON contexts(author_email);
CREATE INDEX idx_contexts_created_at ON contexts(created_at DESC);
CREATE INDEX idx_contexts_created_by ON contexts(created_by);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE contexts ENABLE ROW LEVEL SECURITY;

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
```

## Notes

- Any authenticated user can read all contexts
- Users can only insert/delete their own contexts
- Fetch Git commit data via GitHub API using `commit_sha`
