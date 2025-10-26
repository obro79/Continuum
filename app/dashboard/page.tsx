"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import { ProjectCard } from "@/components/projects/project-card";

interface Project {
  project_id: string;
  github_url: string;
  bucket_name: string;
  bucket_url: string;
  created_at: string;
  is_owner: boolean;
  role: string;
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/projects");
      const data = await response.json();

      if (response.ok) {
        setProjects(data.projects || []);
      } else {
        toast.error("Failed to load projects");
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast.error("An error occurred while loading projects");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      const response = await fetch("/api/projects", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ projectId }),
      });

      if (response.ok) {
        toast.success("Project deleted successfully");
        fetchProjects();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to delete project");
      }
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error("An error occurred while deleting project");
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Projects</h2>
          <p className="text-muted-foreground">
            Manage your GitHub repositories and Supabase buckets
          </p>
        </div>
        <CreateProjectDialog onProjectCreated={fetchProjects} />
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading projects...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            No projects yet. Create your first project to get started.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard
              key={project.project_id}
              projectId={project.project_id}
              githubUrl={project.github_url}
              bucketName={project.bucket_name}
              bucketUrl={project.bucket_url}
              createdAt={project.created_at}
              supabaseUrl={supabaseUrl}
              onDelete={project.is_owner ? handleDeleteProject : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
