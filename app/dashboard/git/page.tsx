"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GitGraphVisualization } from "@/components/git-graph/GitGraphVisualization";
import { mockGitCommits } from "@/lib/mock-data/git-graph";
import { Badge } from "@/components/ui/badge";
import { ConversationView } from "@/components/chat/ConversationView";
import { getConversation } from "@/lib/mock-data/conversations";
import { ProjectDropdown } from "@/components/project-dropdown";
import { GitCommit } from "@/lib/types/git-graph";
import { Project } from "@/lib/mock-data/projects";

export default function GitPage() {
  const [commits, setCommits] = useState<GitCommit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'all' | 'branch'>('all');
  const [selectedBranch, setSelectedBranch] = useState('HEAD');
  const [selectedCommitSha, setSelectedCommitSha] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [commits, setCommits] = useState<GitCommit[]>(mockGitCommits);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch git data when project is selected
  useEffect(() => {
    if (!selectedProject) return;

    async function fetchGitData(project: Project) {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          project_id: project.project_id,
          github_url: project.github_url,
          supabase_bucket: project.bucket_url,
        });

        const response = await fetch(`/api/git-data?${params}`);
        const data = await response.json();

        if (data.commits) {
          setCommits(data.commits);
        }
      } catch (error) {
        console.error('Error fetching git data:', error);
        // Fall back to mock data on error
        setCommits(mockGitCommits);
      } finally {
        setIsLoading(false);
      }
    }

    fetchGitData(selectedProject);
  }, [selectedProject]);

  // Find the selected commit and its context details
  const selectedCommit = selectedCommitSha
    ? commits.find((commit) => commit.commit_sha === selectedCommitSha)
    : null;
  const selectedContext = selectedCommit?.claude_context;


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Git Status</h2>
          <p className="text-muted-foreground">
            Visualizing Git commits with Claude conversation contexts
          </p>
        </div>
        <ProjectDropdown
          selectedProject={selectedProject}
          onProjectSelect={setSelectedProject}
        />
      </div>
      {/* Full height graph container - takes entire content area */}
      <div className="flex flex-col h-[calc(100vh-10rem)]">
        <Card className="flex-1 flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle>Git + Claude Context Visualization</CardTitle>
            <CardDescription>
              {loading ? 'Loading commits...' : error ? 'Error loading commits' : `Showing ${commits.length} commits ${viewMode === 'all' ? 'from all branches' : `from ${selectedBranch}`}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[400px] overflow-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-muted-foreground">Loading git data...</p>
              </div>
            ) : (
              <div className="min-w-[750px] h-[1000px]">
                <GitGraphVisualization
                  commits={commits}
                  selectedCommitSha={selectedCommitSha}
                  onClaudeNodeClick={setSelectedCommitSha}
                  onGitNodeClick={setSelectedCommitSha}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Git Diff Placeholder - Takes 1 column on large screens */}
        <Card>
          <CardHeader>
            <CardTitle>Claude Context Diff</CardTitle>
            <CardDescription>Context diff for given commit</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
            <p className="text-sm text-muted-foreground">
              Select a commit to view diff
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
