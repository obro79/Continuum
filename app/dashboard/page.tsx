"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GitGraphVisualization } from "@/components/git-graph/GitGraphVisualization";
import { mockGitCommits } from "@/lib/mock-data/git-graph";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome to your Claude Code dashboard
        </p>
      </div>
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Git Visualization</CardTitle>
            <CardDescription>Your commits and Claude sessions</CardDescription>
          </CardHeader>
          <CardContent className="h-[600px] overflow-auto flex justify-start">
            <div className="min-w-[750px] h-[1000px]">
              <GitGraphVisualization
                commits={mockGitCommits}
                selectedCommitSha={null}
                onClaudeNodeClick={() => {}}
              />
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Git Status</CardTitle>
            <CardDescription>Repository overview</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              View your Git repository status and recent commits
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Claude Context</CardTitle>
            <CardDescription>Session information</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Claude Code session metadata and environment
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Access frequently used features
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
