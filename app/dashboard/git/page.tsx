"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
//import { GitGraphVisualization } from "@/components/git-graph/GitGraphVisualization";
import { mockGitCommits } from "@/lib/mock-data/git-graph";
import { Badge } from "@/components/ui/badge";
import { ConversationView } from "@/components/chat/ConversationView";
import { getConversation } from "@/lib/mock-data/conversations";
import { ProjectDropdown } from "@/components/project-dropdown";
import { Project } from "@/lib/mock-data/projects";
import { GitGraphCanvas } from "@/components/git-graph/GitGraphCanvas";
import { GitCommit } from "@/lib/types/git-graph";

export default function GitPage() {
  const [commits, setCommits] = useState<GitCommit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'all' | 'branch'>('all');
  const [selectedBranch, setSelectedBranch] = useState('HEAD');
  const [selectedCommitSha, setSelectedCommitSha] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch git data when project is selected
  useEffect(() => {
    if (!selectedProject) return;

    async function fetchGitData(project: Project) {
      setIsLoading(true);
      setCommits([]); // Clear old commits immediately to prevent flash
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

  useEffect(() => {
    if (viewMode === 'all') {
      fetchAllBranches();
    } else {
      fetchCommits(selectedBranch);
    }
  }, [viewMode, selectedBranch]);

  const fetchAllBranches = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/git/commits?all=true&limit=200`);
      const data = await response.json();

      if (data.success) {
        const transformedCommits: GitCommit[] = data.data.map((commit: any) => ({
          commit_sha: commit.commit_sha,
          commit_sha_short: commit.commit_sha_short,
          commit_message: commit.commit_message,
          author_email: commit.author_email,
          timestamp: commit.timestamp,
          parent_sha: commit.parent_sha,
          branches: commit.branches || [],
          claude_context: null,
        }));
        setCommits(transformedCommits);
      } else {
        setError(data.error || 'Failed to fetch commits');
      }
    } catch (err) {
      setError('Failed to connect to API');
      console.error('Error fetching commits:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCommits = async (branch: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/git/commits?branch=${branch}&limit=100`);
      const data = await response.json();

      if (data.success) {
        const transformedCommits: GitCommit[] = data.data.map((commit: any) => ({
          commit_sha: commit.commit_sha,
          commit_sha_short: commit.commit_sha_short,
          commit_message: commit.commit_message,
          author_email: commit.author_email,
          timestamp: commit.timestamp,
          parent_sha: commit.parent_sha,
          claude_context: null,
        }));
        setCommits(transformedCommits);
      } else {
        setError(data.error || 'Failed to fetch commits');
      }
    } catch (err) {
      setError('Failed to connect to API');
      console.error('Error fetching commits:', err);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Git Status</h2>
          <p className="text-muted-foreground">
            Visualizing Git commits with Claude conversation contexts
          </p>
          <div className="mt-4">
            <ProjectDropdown
              selectedProject={selectedProject}
              onProjectSelect={setSelectedProject}
            />
          </div>
        </div>
        <div className="flex gap-3 items-center">
          <div className="h-8 w-px bg-border" />
          <button
            onClick={() => setViewMode('all')}
            className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
              viewMode === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            All Branches
          </button>
          <button
            onClick={() => setViewMode('branch')}
            className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
              viewMode === 'branch'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            Single Branch
          </button>
          {viewMode === 'branch' && (
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="px-3 py-1.5 bg-background border border-border rounded-md text-sm"
            >
              <option value="HEAD">Current Branch</option>
              <option value="origin/main">main</option>
              <option value="origin/backend">backend</option>
              <option value="origin/frontend">frontend</option>
              <option value="origin/frontendv2">frontendv2</option>
            </select>
          )}
          <button
            onClick={() => viewMode === 'all' ? fetchAllBranches() : fetchCommits(selectedBranch)}
            className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm hover:opacity-90"
          >
            Refresh
          </button>
        </div>
      </div>
      {/* Full height graph container - takes entire content area */}
      <div className="flex flex-col h-[calc(100vh-10rem)]">
        <Card className="flex-1 flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle>Git + Claude Context Visualization</CardTitle>
            <CardDescription>
              {(loading || isLoading) ? 'Loading commits...' : error ? 'Error loading commits' : `Showing ${commits.length} commits ${viewMode === 'all' ? 'from all branches' : `from ${selectedBranch}`}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            {(loading || isLoading) ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Loading commits...</p>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-destructive">Error: {error}</p>
              </div>
            ) : commits.length > 0 ? (
              <GitGraphCanvas
                commits={commits}
                selectedCommitSha={selectedCommitSha}
                onClaudeNodeClick={setSelectedCommitSha}
                onGitNodeClick={setSelectedCommitSha}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">No commits found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
