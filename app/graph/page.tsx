import { GitGraphVisualization } from '@/components/git-graph/GitGraphVisualization';
import { mockGitCommits } from '@/lib/mock-data/git-graph';

export default function GraphPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Git + Claude Context Visualization
          </h1>
          <p className="text-muted-foreground">
            Visualizing Git commits (blue) with Claude conversation contexts (orange)
          </p>
        </header>

        <div className="bg-card rounded-lg border border-border p-8 shadow-sm">
          <GitGraphVisualization
            commits={mockGitCommits}
            selectedCommitSha={null}
            onClaudeNodeClick={() => {}}
          />
        </div>
      </div>
    </div>
  );
}
