"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GitGraphCanvas } from "@/components/git-graph/GitGraphCanvas";
import { GitCommit } from "@/lib/types/git-graph";

export default function GitPage() {
  const [commits, setCommits] = useState<GitCommit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'all' | 'branch'>('all');
  const [selectedBranch, setSelectedBranch] = useState('HEAD');
  const [selectedCommitSha, setSelectedCommitSha] = useState<string | null>(null);

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
        </div>
        <div className="flex gap-2 items-center">
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
              {loading ? 'Loading commits...' : error ? 'Error loading commits' : `Showing ${commits.length} commits ${viewMode === 'all' ? 'from all branches' : `from ${selectedBranch}`}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            {loading ? (
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
