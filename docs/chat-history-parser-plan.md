# Plan: Parse Claude Code Chat History & Load Commit Diffs

## What I Found

Your codebase is for a **Claude Code Context Manager** - a tool that:
1. Captures Claude conversation contexts during git commits
2. Stores them in Supabase with team-based access
3. Allows visualization of Claude contexts alongside git history

The `Context` interface stores:
- `jsonl_data` - The raw JSONL conversation history (like what you pasted)
- `commit_sha` and `parent_commit_sha` - For linking contexts to git commits
- Metadata like `total_messages`, `author_email`, etc.

## Answer to Your Question: **Yes, it's very easy!**

You already have:
1. ✅ `parent_commit_sha` field in your Context interface
2. ✅ `parseJsonlData()` utility function in `frontend/lib/mock-data/index.ts:84`
3. ✅ Git integration expected in the design

## Implementation Plan

### 1. **Chat History Parser** (`frontend/lib/parsers/chat-history.ts`)
   - Parse newline-delimited JSON into structured messages
   - Filter out non-message entries (summaries, file snapshots, warmup/sidechain)
   - Extract user/assistant messages with tool uses
   - Handle both simple text and complex content arrays

### 2. **Git Diff Loader** (`frontend/lib/git/diff-loader.ts`)
   - Use `parent_commit_sha` to fetch git diff between commits
   - Leverage Node.js `child_process` to run: `git diff <parent> <commit>`
   - Parse diff output into structured format (files changed, additions, deletions)
   - Cache diff data to avoid repeated git operations

### 3. **Context Diff Viewer Component** (`frontend/components/contexts/context-diff-viewer.tsx`)
   - Display side-by-side: Claude conversation + git diff
   - Show which code changes Claude helped with
   - Highlight connections between chat messages and file changes

### 4. **Integration Points**
   - Update `GitGraphViewer` to load diffs on commit click
   - Add diff view to context detail page
   - Store parsed chat history in component state

## Why This Works Well

Your architecture makes this natural because:
- JSONL format is already line-delimited and easy to parse
- Git SHAs are already tracked per context
- The frontend already uses git-related libraries (@gitgraph)
- You can use the existing `parseJsonlData()` as a starting point

## JSONL Data Structure Analysis

Based on the sample data you provided, the JSONL log contains these entry types:

### Message Types to Parse

1. **User messages** - `{"type":"user","message":{"role":"user","content":"..."}}`
2. **Assistant messages** - `{"type":"assistant","message":{"role":"assistant","content":[...]}}`

### Message Types to Filter Out

3. **Summary objects** - `{"type":"summary"}` (metadata)
4. **File history snapshots** - `{"type":"file-history-snapshot"}` (can be filtered out)
5. **Sidechain messages** - `{"isSidechain":true}` (warmup messages, should be filtered out)

### Content Structure

**User messages:**
- Simple string content: `"content":"Make a random readme.md file here"`
- Tool results in array format: `"content":[{"tool_use_id":"...","type":"tool_result","content":"..."}]`

**Assistant messages:**
- Text responses: `{"type":"text","text":"..."}`
- Tool uses: `{"type":"tool_use","id":"...","name":"Write","input":{...}}`
- Metadata: `model`, `requestId`, `usage` stats

### Parsing Strategy

1. **Split by newlines** - Each line is a separate JSON object
2. **Filter entries** - Keep only `type: "user"` and `type: "assistant"` where `isSidechain` is false/undefined
3. **Extract content**:
   - For strings: use directly
   - For arrays: iterate and extract `text` fields, note `tool_use` items
4. **Build chat history** - Create chronological list with timestamps

### Expected Output Format

From the sample data, a parsed conversation would look like:

```
USER [2025-01-10T14:30:00Z]: Make a random readme.md file here
ASSISTANT [2025-01-10T14:30:15Z]: I'll create a README.md file for you.
  [Tool: Write - creates README.md]
USER [2025-01-10T14:32:00Z]: 123
ASSISTANT [2025-01-10T14:32:10Z]: I see you've sent "123". How can I help you today?
USER [2025-01-10T14:35:00Z]: What are the last two messages that you received
ASSISTANT [2025-01-10T14:35:20Z]: The last two messages I received from you were: 1. "123" 2. "What are the last two messages..."
```

## Implementation Details

### Parser Interface

```typescript
interface ChatMessage {
  timestamp: string;
  role: 'user' | 'assistant';
  content: string;
  toolUses?: ToolUse[];
  metadata?: {
    model?: string;
    requestId?: string;
    usage?: any;
  };
}

interface ToolUse {
  type: string;
  name: string;
  input: any;
}

function parseChatHistory(jsonlData: string): ChatMessage[] {
  // Implementation here
}
```

### Git Diff Interface

```typescript
interface GitDiff {
  commitSha: string;
  parentCommitSha: string;
  files: FileChange[];
  stats: {
    filesChanged: number;
    insertions: number;
    deletions: number;
  };
}

interface FileChange {
  path: string;
  status: 'added' | 'modified' | 'deleted';
  additions: number;
  deletions: number;
  diff: string;
}

async function loadGitDiff(commitSha: string, parentCommitSha: string): Promise<GitDiff> {
  // Implementation here
}
```

## Next Steps

When ready to implement:
1. Create the parser utility (`frontend/lib/parsers/chat-history.ts`)
2. Create the git diff loader (`frontend/lib/git/diff-loader.ts`)
3. Build the UI component to display both together (`frontend/components/contexts/context-diff-viewer.tsx`)
4. Integrate with existing GitGraphViewer component

## Potential Challenges & Solutions

### Challenge 1: Large JSONL Files
- **Problem**: Some contexts may have 1000+ messages
- **Solution**: Implement pagination or virtual scrolling in the UI

### Challenge 2: Git Operations in Browser
- **Problem**: Can't run `git diff` directly in browser
- **Solution**: Create API endpoint that runs git commands server-side

### Challenge 3: Parsing Edge Cases
- **Problem**: Malformed JSON lines, unexpected content types
- **Solution**: Wrap parsing in try/catch, log errors, skip invalid lines

### Challenge 4: Performance
- **Problem**: Parsing large diffs and chat histories on every view
- **Solution**: Cache parsed results, lazy load on demand

## Related Files

- Context Interface: `frontend/lib/mock-data/contexts.ts:1`
- Existing Parser: `frontend/lib/mock-data/index.ts:84`
- Git Graph Viewer: `frontend/components/contexts/git-graph-viewer.tsx`
- Mock Data: `frontend/lib/mock-data/contexts.ts:16-36` (sample conversations)
- Schema Design: `supabase_schema.md`

## Future Enhancements

- **Semantic Linking**: Automatically link chat messages to specific file changes
- **AI Summary**: Summarize what Claude helped with in each commit
- **Search**: Full-text search across conversations
- **Export**: Export conversation + diff as markdown or PDF
- **Diff Highlighting**: Show which lines Claude discussed in the conversation