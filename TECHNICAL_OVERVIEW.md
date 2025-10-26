# Continuum - Technical Overview

---

## Slide 1: What is Continuum?

**Git-Integrated Claude Code History System**

- Captures Claude Code conversation snapshots at commit points
- Enables restoration when checking out historical commits
- Visualizes Git commits + Claude contexts as an interactive graph

**Core Principle:**
> "Git handles branching, we handle snapshots between commits A → B"

---

## Slide 2: Architecture Stack

### Frontend
- **Next.js 16.0** - App Router + React Server Components
- **React 19.2** - With React Compiler enabled
- **TypeScript 5** - Strict mode
- **Tailwind CSS 4** - Design tokens system

### Backend & Data
- **Supabase** - SSR-enabled database
- **Storage Model:**
  - JSONL conversations → Supabase database
  - Metadata references → `.cc-snapshots/` (git-tracked)
  - Local state → `.cc-context/` (gitignored)

### UI Components
- **Radix UI** primitives + custom components
- **React Hook Form + Zod** validation

---

## Slide 3: Data Storage Model

```
┌─────────────────────────────────────────┐
│  Git Repository                         │
│  ├── .cc-snapshots/{commit-sha}/       │ ← Git-tracked
│  │   └── metadata.json                 │   (references only)
│  └── .cc-context/state.json            │ ← Gitignored
└─────────────────────────────────────────┘
                    ↓
                 References
                    ↓
┌─────────────────────────────────────────┐
│  Supabase Database                      │
│  ├── users                              │
│  └── contexts                           │ ← Actual JSONL storage
│      ├── context_id (PK)                │   • Merged sessions
│      ├── commit_sha                     │   • Full conversation
│      └── conversation_jsonl             │   • Public read (auth)
└─────────────────────────────────────────┘
```

**Why this model?**
- Keep repos lightweight (no conversation data)
- Enable sharing contexts across team
- Maintain git history integrity

---

## Slide 4: Session Continuity System

### Session Flow Logic

```
new_session: true  → Branch out to new Claude context
new_session: false → Vertical continuation (same session)
```

### Session Merging
When multiple Claude sessions exist between commits:

1. Load from `~/.claude/projects/{encoded-path}/`
2. Sort chronologically by timestamp
3. Insert boundary markers: `"--- USER STARTED NEW SESSION ---"`
4. Relink parent UUIDs to create unified thread
5. Store as single JSONL in database

**Result:** Complete conversation history with clear session boundaries

---

## Slide 5: Graph Visualization

### Visual Design
- **Blue Timeline** (left) - Continuous Git commit history
- **Orange Nodes** (right) - Claude context snapshots
- **Orange Connections** - Context flow between commits

### Connection Types
```
Git → Claude  = Branch (new session starts)
Claude → Claude = Vertical (session continues)
Claude → Git   = Merge (session ends at commit)
```

### Technical Implementation
- Pure SVG (no canvas)
- Fixed node radius (8px)
- Smooth arc curves for connections
- Top-to-bottom vertical scrolling

---

## Slide 6: Project Structure

```
app/
├── (auth)/login/           # Authentication
├── api/projects/           # Project management API
├── dashboard/              # Main UI
│   ├── page.tsx           # Projects list
│   ├── git/               # Git visualization
│   └── settings/          # Settings
└── graph/                 # Standalone graph view

components/
├── chat/                  # Chat UI components
├── git-graph/            # SVG graph visualization
│   ├── GitNode.tsx       # Blue commit nodes
│   ├── ClaudeNode.tsx    # Orange context nodes
│   └── ConnectionLine.tsx # Orange paths
└── projects/             # Project management UI

lib/
├── types/                # TypeScript definitions
├── utils/
│   └── graph-layout.ts   # Position calculation + SVG paths
└── supabase/            # Database clients
```

---

## Slide 7: Future Git Integration

### Context Capture (pre-commit hook)
```bash
1. Identify commit boundary (parent SHA + timestamp)
2. Discover active Claude sessions
3. Analyze session continuity
4. Parse and merge session JSONL files
5. Upload to Supabase → get context_id
6. Write metadata.json with reference
```

### Context Restoration (cc-restore command)
```bash
1. Read .cc-snapshots/{commit-sha}/metadata.json
2. Fetch JSONL from Supabase by context_id
3. Create new session UUID
4. Provide resume command
```

---

## Slide 8: Key Design Decisions

### Merge Commits = No Context
- **Why?** No conversation happens during merge
- **Detection:** `git rev-parse --verify HEAD^2`
- **Behavior:** Skip capture, write marker to metadata

### Path Aliases for Clean Imports
```typescript
import { GitCommit } from '@/lib/types/git-graph'
import { Button } from '@/components/ui/button'
```

### Design Tokens System
```typescript
import designTokens from '@/lib/design-tokens'
// Git Blue: #3b82f6
// Claude Orange: designTokens.colors.accent.orange
```

---

## Slide 9: Current MVP Status

### Implemented ✓
- Graph rendering with mock data (7 commits)
- Git timeline (blue vertical line)
- Claude nodes + connections (orange)
- Branch/vertical/merge flow logic
- Desktop-responsive design
- Project management UI

### Not Yet Implemented
- Click interactions / details modal
- Real-time Supabase integration
- GitHub API integration
- Git hook automation
- Mobile responsive design

---

## Slide 10: Development Workflow

### Quick Start
```bash
npm install              # Install dependencies
npm run dev             # Start at localhost:3000
```

### Key Commands
```bash
npm run build           # Production build
npm start              # Production server
npm run lint           # Run linter
```

### Environment Setup
```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## Questions?

**Documentation:**
- `SETUP.md` - Setup guide + design decisions
- `tech_design.md` - Full technical design
- `schema.md` - Database schema
- `CLAUDE.md` - Development guidelines
