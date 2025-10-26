# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Continuum is a Git-integrated system that captures Claude Code conversation history at commit points and enables restoration when checking out historical commits. It visualizes the relationship between Git commits and Claude contexts as an interactive graph.

**Core Principle:** "Git handles branching, we handle snapshots between commits A → B"

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (localhost:3000)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Architecture

### Tech Stack
- **Framework:** Next.js 16.0.0 with App Router and React Server Components
- **React:** 19.2.0 with React Compiler enabled (babel-plugin-react-compiler)
- **TypeScript:** 5.x with strict mode
- **Styling:** Tailwind CSS 4 with design tokens system
- **Database:** Supabase (SSR-enabled client)
- **UI Components:** Radix UI primitives + custom components
- **Forms:** React Hook Form + Zod validation

### Project Structure

```
/
├── app/                          # Next.js App Router
│   ├── (auth)/login/            # Auth routes (route group)
│   ├── api/                     # API routes
│   │   └── projects/           # Project management endpoints
│   │       ├── route.ts        # GET (list) and DELETE projects
│   │       └── create/route.ts # POST create project + bucket
│   ├── dashboard/               # Main dashboard
│   │   ├── page.tsx            # Projects management (main)
│   │   ├── git/                # Git visualization page
│   │   └── settings/           # Settings page
│   └── graph/                   # Standalone graph visualization (/graph)
│
├── components/
│   ├── chat/                    # Chat UI components
│   │   ├── ChatMessage.tsx     # Individual message display
│   │   └── ConversationView.tsx # Full conversation rendering
│   ├── git-graph/              # SVG-based graph visualization
│   │   ├── GitGraphVisualization.tsx  # Main orchestrator
│   │   ├── GitNode.tsx         # Blue Git commit nodes
│   │   ├── ClaudeNode.tsx      # Orange Claude context nodes
│   │   ├── GitTimeline.tsx     # Continuous blue vertical line
│   │   └── ConnectionLine.tsx  # Orange connection paths
│   ├── projects/               # Project management components
│   │   ├── create-project-dialog.tsx  # Create project form
│   │   └── project-card.tsx    # Display project with CLI commands
│   ├── dashboard-sidebar.tsx   # Navigation sidebar
│   ├── dashboard-topnav.tsx    # Top navigation bar
│   └── ui/                     # shadcn/ui components
│       ├── code-block.tsx      # Code display with copy button
│       ├── dialog.tsx          # Dialog/modal component
│       └── sonner.tsx          # Toast notifications
│
├── lib/
│   ├── types/                   # TypeScript definitions
│   │   ├── git-graph.ts        # Graph data structures
│   │   └── chat.ts             # Chat message types
│   ├── mock-data/              # Development mock data
│   │   ├── git-graph.ts        # 7-commit test dataset
│   │   └── conversations.ts    # Sample conversations
│   ├── utils/
│   │   ├── graph-layout.ts     # Graph position calculation & SVG path generation
│   │   ├── validate-github-url.ts  # GitHub URL validation
│   │   └── sanitize-github-url.ts  # URL to bucket name conversion
│   ├── supabase/               # Database clients
│   │   ├── client.ts           # Browser client
│   │   └── server.ts           # Server-side client
│   ├── design-tokens.ts        # Design system tokens
│   └── utils.ts                # General utilities (cn helper)
│
├── .cc-snapshots/               # Git-tracked metadata (context references)
├── .cc-context/                 # Local state (gitignored)
└── .env.example                 # Environment variables template
```

### Path Aliases
All imports use `@/*` to reference the root directory:
```typescript
import { GitCommit } from '@/lib/types/git-graph'
import { Button } from '@/components/ui/button'
```

## Key Architectural Patterns

### Data Storage Model

**Context Storage:**
- JSONL conversation data stored in **Supabase database** (not in repo)
- Git-tracked metadata in `.cc-snapshots/{commit-sha}/metadata.json` contains only references
- Local state tracking in `.cc-context/state.json` (gitignored)

**Database Schema (Supabase):**
- `users` table: User profiles linked to auth.users
- `contexts` table: Context metadata with JSONL storage
  - Primary key: `context_id` (e.g., "ctx-550e8400")
  - Links to commits via `commit_sha`
  - Stores merged JSONL from multiple sessions
  - Public read access for authenticated users

### Session Continuity System

**Session Flow Logic:**
- `new_session: true` → Merge previous session + Branch out to new session
- `new_session: false` → Vertical connection (same session continues)

**Connection Types (all rendered in orange):**
- **Branch:** Git → Claude (when new session starts)
- **Vertical:** Claude → Claude (session continues)
- **Merge:** Claude → Git (when session ends)

**Session Merging:**
When multiple Claude sessions exist between commits, they are:
1. Loaded and parsed from `~/.claude/projects/{encoded-path}/`
2. Sorted chronologically by timestamp
3. Boundary markers inserted: `"--- USER STARTED NEW SESSION ({id}) ---"`
4. Parent UUIDs relinked to create unified conversation thread
5. Stored as single JSONL in database

### Graph Visualization

**Layout Constants (lib/utils/graph-layout.ts):**
- Git nodes on left (blue), Claude nodes on right (orange)
- Vertical scrolling, top to bottom
- Continuous blue timeline connects all Git nodes
- Orange connections show Claude context flow

**Node Design:**
- Fixed radius (8px) for all nodes
- Git nodes: 6-character SHA displayed to LEFT of circle
- Claude nodes: No labels in MVP
- No size scaling based on message count

**Curve Handling:**
- Branch curves: Smooth arc DOWN from Git → Claude
- Merge curves: Smooth arc DOWN from Claude → Git
- Configuration: `CURVE_CONTROL_OFFSET: 100` in graph-layout.ts

### Environment Variables

Required for Supabase integration (`.env.local`):
```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # Required for bucket creation
```

See `.env.example` for a template.

## Design System

### Color Tokens
Defined in `lib/design-tokens.ts`:
- **Git Blue:** `#3b82f6`
- **Claude Orange:** `designTokens.colors.accent.orange`

To use design tokens:
```typescript
import designTokens from '@/lib/design-tokens'
// Access: designTokens.colors.accent.orange
```

### Styling Guidelines
- Use Tailwind CSS classes for layout and spacing
- Pure custom SVG components for graph visualization (no canvas)
- shadcn/ui components for standard UI elements
- Custom components extend Radix UI primitives

## Common Development Tasks

### Modifying Mock Data
Edit `lib/mock-data/git-graph.ts` to change:
- Number of test commits
- Session patterns (`new_session` flags)
- Message counts
- Commit messages and metadata

### Adjusting Graph Layout
Edit `lib/utils/graph-layout.ts`:
- Node positions: `GIT_X`, `CLAUDE_X`
- Vertical spacing: `COMMIT_SPACING`
- Curve styles: `CURVE_CONTROL_OFFSET`
- Claude node offset: `CLAUDE_OFFSET_Y` (~15px below Git node)

### Adding Interactivity
Currently MVP has no interactions. To add:
- Click handlers in `components/git-graph/*` components
- Hover states and tooltips
- Modal/panel for context details

### Connecting Real Data
Replace mock data imports with Supabase queries:
1. Create API route: `app/api/graph/route.ts`
2. Fetch from `contexts` table using Supabase client
3. Merge with GitHub API commit data using `commit_sha`
4. Populate `GitCommit` interface with real data

## Important Edge Cases

### Merge Commits
- Design decision: Merge commits have NO context
- Detection: `git rev-parse --verify HEAD^2` succeeds
- Behavior: Skip context capture, write marker to metadata
- Rationale: No conversation during merge, ambiguous which context to use

### Session Continuity Detection
- Check if session ID exists in parent commit's metadata
- If exists: `continued_from_parent: true`, track delta messages
- If new: `continued_from_parent: false`, fresh session
- Mixed scenarios: Multiple terminals = multiple sessions merged chronologically

### Commits Without Context
- Show Git node only (no Claude node, no branch line)
- Example: Commit 7 in mock data
- Merges previous session back to Git timeline

## MVP Scope

**Currently Implemented:**
- Graph rendering with mock data (7 commits)
- Git timeline (continuous blue vertical line)
- Claude timeline (orange nodes when contexts exist)
- Branch/vertical/merge connections (all orange)
- Desktop-only responsive design

**Not Yet Implemented:**
- Click interactions / details modal
- Hover states / tooltips
- Zoom/pan controls
- Real-time Supabase integration
- GitHub API integration
- Multiple repository support
- Filters/search functionality
- Mobile responsive design

## Git Integration (Future)

### Context Capture Workflow
Planned `pre-commit` hook will:
1. Identify commit boundary (parent SHA + timestamp)
2. Discover active sessions in `~/.claude/projects/{encoded-path}/`
3. Analyze session continuity (continued vs fresh)
4. Parse and merge multiple session JSONL files
5. Upload merged JSONL to Supabase
6. Generate metadata.json with context_id reference

### Context Restoration Workflow
Planned `cc-restore` command will:
1. Fetch context_id from `.cc-snapshots/{commit-sha}/metadata.json`
2. Download JSONL from Supabase
3. Create new session UUID in Claude projects directory
4. Provide resume command for user

## Testing Strategy

**Manual Testing:**
- View graph at `/graph` route
- Verify session flow logic with 7-commit mock data
- Test responsive layout (desktop only)

**Visual Testing:**
- Ensure Git nodes aligned vertically on left
- Verify Claude nodes offset ~15px below corresponding Git nodes
- Check connection curves are smooth arcs (not S-shapes or loops)

## Troubleshooting

### Port Conflicts
```bash
PORT=3001 npm run dev
```

### Build Errors
```bash
rm -rf .next
npm run dev
```

### TypeScript Errors
Ensure strict mode compliance and all dependencies installed:
```bash
npm install
```

### Supabase Connection Issues
- Verify environment variables in `.env.local`
- Check Supabase project URL and anon key
- Ensure RLS policies allow authenticated read access

## Documentation References

See project documentation:
- `SETUP.md` - Detailed setup guide with all design decisions and Q&A
- `tech_design.md` - Full technical design document
- `schema.md` - Supabase database schema and migration
- `lib/DESIGN_TOKENS_README.md` - Design tokens documentation
