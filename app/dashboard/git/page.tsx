"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GitGraphVisualization } from "@/components/git-graph/GitGraphVisualization";
import { mockGitCommits } from "@/lib/mock-data/git-graph";
import { Badge } from "@/components/ui/badge";
import { ConversationView } from "@/components/chat/ConversationView";
import { getConversation } from "@/lib/mock-data/conversations";

export default function GitPage() {
  const [selectedCommitSha, setSelectedCommitSha] = useState<string | null>(null);

  // Find the selected commit and its context details
  const selectedCommit = selectedCommitSha
    ? mockGitCommits.find((commit) => commit.commit_sha === selectedCommitSha)
    : null;
  const selectedContext = selectedCommit?.claude_context;

  // Get conversation messages for the selected context
  const conversation = selectedContext
    ? getConversation(selectedContext.context_id)
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Git Status</h2>
        <p className="text-muted-foreground">
          Visualizing Git commits with Claude conversation contexts
        </p>
      </div>
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Git Graph - Takes 2 columns on large screens */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Git + Claude Context Visualization</CardTitle>
            <CardDescription>Click on blue nodes (Git commits) or orange nodes (Claude contexts) to view details</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px] overflow-auto">
            <div className="min-w-[750px] h-[1000px]">
              <GitGraphVisualization
                commits={mockGitCommits}
                selectedCommitSha={selectedCommitSha}
                onClaudeNodeClick={setSelectedCommitSha}
                onGitNodeClick={setSelectedCommitSha}
              />
            </div>
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

      {/* Claude Conversation - Full width below */}
      <Card>
        <CardHeader>
          <CardTitle>Claude Conversation</CardTitle>
          <CardDescription>
            {selectedContext ? (
              <div className="flex items-center gap-3">
                <span>Context ID: {selectedContext.context_id}</span>
                <Badge variant="secondary">{conversation?.messages.length || 0} messages</Badge>
                <Badge variant={selectedContext.new_session ? "default" : "outline"}>
                  {selectedContext.new_session ? "New Session" : "Continuing Session"}
                </Badge>
              </div>
            ) : (
              "Click a Git commit or Claude context to view conversation"
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[500px] p-0">
          {conversation ? (
            <ConversationView messages={conversation.messages} />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-muted-foreground">
                Select a Git commit (blue node) or Claude context (orange node) to view details
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
