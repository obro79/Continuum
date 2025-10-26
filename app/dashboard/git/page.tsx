"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
//import { GitGraphVisualization } from "@/components/git-graph/GitGraphVisualization";
import { Badge } from "@/components/ui/badge";
import { ConversationView } from "@/components/chat/ConversationView";
import { getConversation } from "@/lib/mock-data/conversations";
import { ProjectDropdown } from "@/components/project-dropdown";
import { Project } from "@/lib/mock-data/projects";
import { GitGraphCanvas } from "@/components/git-graph/GitGraphCanvas";
import { GitCommit } from "@/lib/types/git-graph";
import { ChatHistory } from "@/components/chat/ChatHistory";
import { mockChatMessages } from "@/lib/mock-data/chat-messages";

export default function GitPage() {
  const [commits, setCommits] = useState<GitCommit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'all' | 'branch'>('all');
  const [selectedBranch, setSelectedBranch] = useState('HEAD');
  const [selectedCommitSha, setSelectedCommitSha] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedContextId, setSelectedContextId] = useState<string | null>(null);

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

        // Fetch commits from git-data API
        const response = await fetch(`/api/git-data?${params}`);
        const data = await response.json();

        console.log('📊 [GIT-DATA RESPONSE]:', {
          project: project.bucket_name,
          commitCount: data.commits?.length || 0,
        });

        if (data.commits) {
          // Fetch contexts from bundle-mapping API
          try {
            console.log('📦 Fetching contexts from bundle...');
            const bundleResponse = await fetch(`/api/projects/${project.project_id}/bundle-mapping`);

            if (bundleResponse.ok) {
              const bundleData = await bundleResponse.json();
              console.log('✅ Bundle contexts:', bundleData.contexts);

              // Merge contexts with commits
              console.log('🔀 Merging contexts with commits');
              console.log('📌 Bundle contexts keys:', Object.keys(bundleData.contexts || {}));
              console.log('📌 First 3 commit SHAs:', data.commits.slice(0, 3).map((c: any) => c.commit_sha));

              const commitsWithContexts = data.commits.map((commit: GitCommit) => {
                const context = bundleData.contexts?.[commit.commit_sha];

                if (context) {
                  console.log(`✅ Found context for ${commit.commit_sha_short}: ${context.context_id}`);
                  return {
                    ...commit,
                    claude_context: {
                      context_id: context.context_id,
                      total_messages: context.total_messages,
                      new_session: context.new_session,
                    }
                  };
                }
                return commit;
              });

              const contextsFound = commitsWithContexts.filter(c => c.claude_context).length;
              console.log(`📊 Total contexts merged: ${contextsFound} out of ${commitsWithContexts.length} commits`);

              console.log('🔍 Sample commits with context:', commitsWithContexts
                .filter(c => c.claude_context)
                .slice(0, 3)
                .map(c => ({
                  sha: c.commit_sha_short,
                  context_id: c.claude_context?.context_id,
                  messages: c.claude_context?.total_messages,
                  new_session: c.claude_context?.new_session,
                }))
              );

              setCommits(commitsWithContexts);
            } else {
              console.warn('⚠️ Bundle API failed, showing commits without contexts');
              setCommits(data.commits);
            }
          } catch (error) {
            console.error('Error fetching bundle contexts:', error);
            // Fall back to commits without contexts
            setCommits(data.commits);
          }
        }
      } catch (error) {
        console.error('Error fetching git data:', error);
        setCommits([]); // No fallback - show empty state on error
      } finally {
        setIsLoading(false);
      }
    }

    fetchGitData(selectedProject);
  }, [selectedProject]);

  useEffect(() => {
    // Only fetch from local git if no project is selected
    // When a project is selected, fetchGitData handles everything
    if (!selectedProject) {
      if (viewMode === 'all') {
        fetchAllBranches();
      } else {
        fetchCommits(selectedBranch);
      }
    }
  }, [viewMode, selectedBranch, selectedProject]);

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
          claude_context: null, // Note: local git commands don't have context data
        }));

        // Note: This endpoint uses local git commands and doesn't fetch contexts
        // For full context data, use the /api/git-data endpoint with project_id
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

        // Note: Local git commands don't have context data
        // Use the project selector to fetch from git-data API with contexts
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


  // Handle Claude node click to show chat history
  const handleClaudeNodeClick = (commitSha: string) => {
    setSelectedCommitSha(commitSha);

    // Find the commit and its context
    const commit = commits.find(c => c.commit_sha === commitSha);
    if (commit?.claude_context) {
      setSelectedContextId(commit.claude_context.context_id);
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
        <ProjectDropdown
          selectedProject={selectedProject}
          onProjectSelect={setSelectedProject}
        />
      </div>

      {/* Container with fixed heights for both components */}
      <div className="flex flex-col h-[calc(100vh-10rem)]">
        {/* Graph container - takes 65% of the height for better proportion */}
        <Card className="flex flex-col h-[65%]">
          <CardHeader className="pb-2">
            <CardTitle>Git + Claude Context Visualization</CardTitle>
            <CardDescription>
              {(loading || isLoading) ? 'Loading commits...' : error ? 'Error loading commits' : `Showing ${commits.length} commits ${viewMode === 'all' ? 'from all branches' : `from ${selectedBranch}`}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 p-2 overflow-hidden">
            {(loading || isLoading) ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Loading commits...</p>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-destructive">Error: {error}</p>
              </div>
            ) : commits.length > 0 ? (
              <div className="w-full h-full">
                <GitGraphCanvas
                  commits={commits}
                  selectedCommitSha={selectedCommitSha}
                  onClaudeNodeClick={handleClaudeNodeClick}
                  onGitNodeClick={setSelectedCommitSha}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">No commits found</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chat History Panel - Always visible, takes 35% */}
        <Card className="h-[35%] mt-4 flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Session History</CardTitle>
            <CardDescription>
              {selectedContextId ? `Context: ${selectedContextId}` : 'Click a Claude node to view chat history'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-auto">
            {selectedContextId ? (
              <ChatHistory
                messages={mockChatMessages['session-1'] || []}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Select a Claude node to view conversation</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
