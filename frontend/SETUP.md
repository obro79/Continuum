# Git + Claude Context Visualization - Setup Guide

## Quick Start

### Prerequisites
- Node.js 20+ installed
- npm or yarn package manager

### Initial Setup

1. **Navigate to frontend directory:**
   ```bash
   cd /path/to/CCC/frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **View the visualization:**
   Open browser to `http://localhost:3000/graph`

## Project Structure

```
frontend/
├── app/
│   ├── graph/
│   │   └── page.tsx                    # Main graph visualization page
│   ├── page.tsx                        # Home page
│   └── layout.tsx                      # Root layout
│
├── components/
│   └── git-graph/
│       ├── GitGraphVisualization.tsx   # Main orchestrator component
│       ├── GitNode.tsx                 # Blue Git commit nodes
│       ├── ClaudeNode.tsx              # Orange Claude context nodes
│       ├── GitTimeline.tsx             # Continuous blue vertical line
│       └── ConnectionLine.tsx          # Orange connection paths
│
├── lib/
│   ├── types/
│   │   └── git-graph.ts                # TypeScript type definitions
│   ├── mock-data/
│   │   └── git-graph.ts                # Mock 7-commit dataset
│   ├── utils/
│   │   └── graph-layout.ts             # Position calculations & SVG paths
│   └── design-tokens.ts                # Design system tokens
│
└── package.json
```

## How It Works

### Data Flow
1. **Mock Data** (`lib/mock-data/git-graph.ts`) provides 7 commits with Claude contexts
2. **Layout Engine** (`lib/utils/graph-layout.ts`) calculates node positions and SVG paths
3. **Main Component** (`GitGraphVisualization.tsx`) orchestrates rendering
4. **Individual Components** render nodes and connections

### Visualization Logic

**Session Flow:**
- `new_session: true` → Merge previous session + Branch out to new session
- `new_session: false` → Vertical connection (same session continues)

**Connection Types:**
- **Branch:** Git → Claude (when new session starts)
- **Vertical:** Claude → Claude (session continues)
- **Merge:** Claude → Git (when session ends)

**Session Pattern (7 commits):**
- Session 1: Commits 1→2→3 (10, 8, 5 messages)
- Session 2: Commits 4→5 (6, 4 messages)
- Session 3: Commit 6 (4 messages)
- Commit 7: No context (ends session 3)

## Design Decisions & Requirements

### Core Functionality (Answered During Implementation)

#### Data & Architecture
**Q: Data source for MVP?**
A: Mock data only. Using 7 commits pattern per specification. Supabase integration is future work.

**Q: Where does `new_session` boolean come from?**
A: It's defined in the mock data and will eventually come from the Supabase `contexts` table.

**Q: How to determine when a session ends?**
A: Session ends when:
- Next commit has `new_session: true`, OR
- No more commits exist, OR
- Next commit has no Claude context

**Q: Relationship between commits and contexts?**
A: 1:1 relationship for MVP. One commit can have one Claude context or none.

#### Graph Layout
**Q: Graph scroll direction?**
A: Vertical scrolling, top to bottom. Git on left (blue), Claude on right (orange), side by side.

**Q: Initial zoom/viewport?**
A: Show all commits, no zoom controls for MVP. Desktop-only.

**Q: Timeline visualization?**
A: Continuous blue vertical line connecting all Git nodes on the left side.

#### Node Design
**Q: Git node labels?**
A: 6-character SHA (e.g., "abc123") displayed to the LEFT of the blue circle.

**Q: Claude node labels?**
A: No labels on Claude nodes for now.

**Q: Node sizes?**
A: Fixed radius (8px) for all nodes. No scaling based on message count.

#### Connection Lines
**Q: Branch out curve style?**
A: Curve DOWN from Git → Claude when `new_session: true`. Should be smooth arc, not S-shape.

**Q: Merge back curve style?**
A: Curve DOWN from Claude → Git when session ends. Should be smooth arc.

**Q: Vertical connections?**
A: Straight orange line connecting Claude nodes when `new_session: false`.

**Q: Connection colors?**
A: ALL connections are orange (`designTokens.colors.accent.orange`). Git timeline is blue.

**Q: Line overlap handling?**
A: Not needed for MVP. Fixed positions prevent overlaps with current 7-commit dataset.

#### Session Continuity
**Q: Visual indicator that commits belong to same session?**
A: Vertical orange line connecting Claude nodes shows session continuity. No additional colored bands.

**Q: Show continuation vs new session?**
A: `new_session: false` = vertical line (continuation). `new_session: true` = merge + branch pattern.

### Interactivity & UX (MVP Scope)

**Q: Click Git node behavior?**
A: Not implemented in MVP. No click handlers.

**Q: Click Claude node behavior?**
A: Not implemented in MVP. No modal/details panel.

**Q: Hover states?**
A: Not implemented in MVP. No tooltips or highlights.

**Q: Navigation/breadcrumbs?**
A: Not implemented in MVP. Just the `/graph` page.

**Q: Filters/search?**
A: Not implemented in MVP.

### MVP Feature Scope

**IN SCOPE:**
- ✅ Render graph with mock data (7 commits)
- ✅ Git timeline (continuous blue vertical line)
- ✅ Claude timeline (orange nodes when contexts exist)
- ✅ Branch/vertical/merge connection lines (all orange)
- ✅ Desktop-only responsive design
- ✅ Visual accuracy per specification

**OUT OF SCOPE (Future):**
- ❌ Click interactions / details modal
- ❌ Hover states / tooltips
- ❌ Zoom/pan controls
- ❌ Dark mode support (uses default Tailwind theme)
- ❌ Supabase integration
- ❌ Real Git data from GitHub API
- ❌ Multiple repository support
- ❌ Filters/search functionality
- ❌ Mobile responsive design

### Technical Decisions

**Q: State management approach?**
A: React hooks only (`useState`, `useMemo`). No external state library needed for MVP.

**Q: Data fetching strategy?**
A: Not applicable for MVP (using mock data). Future: Server Components or API routes with Supabase.

**Q: Styling approach?**
A: Use existing design tokens (`designTokens.colors.accent.orange` for Claude orange, `#3b82f6` for Git blue). Tailwind CSS for layout.

**Q: Component library?**
A: Pure custom SVG components. No shadcn/ui needed for visualization itself.

**Q: Mobile support?**
A: Desktop-only for MVP. Mobile is out of scope.

### Edge Cases & Special Handling

**Q: Commit with no Claude context?**
A: Show Git node only (e.g., commit 7). No Claude node, no branch line. Merge previous session.

**Q: Many sessions at one commit?**
A: Not applicable for MVP (1:1 relationship). Future consideration.

**Q: Merge commits?**
A: Special case per tech design doc: merge commits always open new Claude session if they have context.

**Q: Very long sessions (100+ messages)?**
A: No special handling for MVP. All nodes same size regardless of message count.

**Q: Error states?**
A: No error handling in MVP. Assumes valid mock data.

### Specification Details

**Q: Claude node offset?**
A: ~15px below corresponding Git node. Adjustable via `CLAUDE_OFFSET_Y` in layout config.

**Q: Bezier curve steepness?**
A: Currently using `CURVE_CONTROL_OFFSET: 100`. Gentle to moderate arc. Needs refinement - current implementation creates S-shapes and loops (to be fixed).

**Q: Session markers in UI?**
A: No. Session markers like `"--- USER STARTED NEW SESSION ---"` exist only in JSONL data, not visual display.

**Q: Mock data extent?**
A: Exactly 7 commits as specified. Realistic commit messages and timestamps for testing.

### Priority & Goals

**Immediate Goal:** Visual prototype with mock data that accurately matches specification.

**Success Criteria:**
1. Visual accuracy (matches spec layout exactly)
2. Correct session flow logic (branch/vertical/merge)
3. Clean, maintainable code
4. Easy to extend with real data later

**Priority Ranking:**
1. **Visual accuracy** (highest priority)
2. **Code quality/maintainability**
3. **Real data integration** (future)
4. **Interactivity** (future)
5. **Polish/animations** (future)

## Development Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Making Changes

### Modifying Mock Data
Edit `frontend/lib/mock-data/git-graph.ts` to change:
- Number of commits
- Session patterns (new_session flags)
- Message counts
- Commit messages

### Adjusting Layout
Edit `frontend/lib/utils/graph-layout.ts` to change:
- Node positions (GIT_X, CLAUDE_X)
- Spacing between commits (COMMIT_SPACING)
- Curve styles (CURVE_CONTROL_OFFSET)
- Colors

### Adding Interactivity
Modify individual components in `frontend/components/git-graph/`:
- Add click handlers
- Add hover states
- Add tooltips

## Tech Stack

- **Framework:** Next.js 16.0.0 with App Router
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 4
- **UI Library:** React 19.2.0
- **Rendering:** Pure SVG (no canvas)

## Troubleshooting

### Port already in use
If port 3000 is taken:
```bash
PORT=3001 npm run dev
```

### Build errors
Clear Next.js cache:
```bash
rm -rf .next
npm run dev
```

### TypeScript errors
Ensure all dependencies are installed:
```bash
npm install
```

## Future Integration

### Connecting to Supabase
1. Set up environment variables in `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
   ```

2. Replace mock data import in `app/graph/page.tsx`:
   ```typescript
   // Instead of: import { mockGitCommits } from '@/lib/mock-data/git-graph'
   // Fetch from Supabase contexts table
   ```

3. Create API route in `app/api/graph/route.ts` to fetch from database

### Adding Real Git Data
- Fetch commit data from GitHub API using `commit_sha`
- Merge with Claude context data from Supabase
- Populate `GitCommit` interface with real data

## Design Tokens

Colors are defined in `lib/design-tokens.ts`:
- **Git Blue:** `#3b82f6`
- **Claude Orange:** `designTokens.colors.accent.orange`

To change colors, update design tokens file.