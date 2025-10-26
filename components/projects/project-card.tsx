"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CodeBlock } from "@/components/ui/code-block";
import { ExternalLink, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProjectCardProps {
  projectId: string;
  githubUrl: string;
  bucketName: string;
  bucketUrl: string;
  createdAt: string;
  supabaseUrl?: string;
  onDelete?: (projectId: string) => void;
}

export function ProjectCard({
  projectId,
  githubUrl,
  bucketName,
  bucketUrl,
  createdAt,
  supabaseUrl,
  onDelete,
}: ProjectCardProps) {
  const handleDelete = () => {
    if (onDelete && confirm('Are you sure you want to delete this project?')) {
      onDelete(projectId);
    }
  };

  // Environment variables for user's local .env.local
  const envVars = `SUPABASE_URL=${supabaseUrl || 'your-supabase-url'}
SUPABASE_SERVICE_KEY=your-service-role-key
SUPABASE_BUCKET=${bucketName}`;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline flex items-center gap-1"
              >
                {githubUrl.replace('https://github.com/', '')}
                <ExternalLink className="h-4 w-4" />
              </a>
            </CardTitle>
            <CardDescription>
              Created {new Date(createdAt).toLocaleDateString()}
            </CardDescription>
          </div>
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              className="h-8 w-8 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete project</span>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium mb-1">Bucket Name</p>
          <p className="text-sm text-muted-foreground font-mono">{bucketName}</p>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Environment Variables (.env.local)</p>
          <CodeBlock code={envVars} />
          <p className="text-xs text-muted-foreground">
            Add these to your repository's .env.local file. Get your service role key from Supabase Dashboard → Settings → API.
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Setup Commands</p>
          <div className="space-y-2">
            {["cc-init", `cc-sync ${bucketUrl}`].map((cmd, idx) => (
              <CodeBlock key={idx} code={cmd} />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
