"use client";

import { useState, useEffect } from "react";
import { ChevronDown, FolderGit2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Project } from "@/lib/mock-data/projects";

interface ProjectDropdownProps {
  selectedProject: Project | null;
  onProjectSelect: (project: Project) => void;
}

export function ProjectDropdown({ selectedProject, onProjectSelect }: ProjectDropdownProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchProjects() {
      try {
        const response = await fetch('/api/projects');
        const data = await response.json();

        if (data.projects) {
          setProjects(data.projects);
          // Auto-select first project if none selected
          if (!selectedProject && data.projects.length > 0) {
            onProjectSelect(data.projects[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-[250px] justify-between bg-background">
          <div className="flex items-center gap-2">
            <FolderGit2 className="h-4 w-4" />
            <span className="truncate">
              {isLoading ? "Loading..." : selectedProject?.name || "Select a project"}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[250px] bg-background/100 border-2 shadow-lg z-50 backdrop-blur-none">
        <DropdownMenuLabel>Your Projects</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {projects.length === 0 ? (
          <DropdownMenuItem disabled>No projects found</DropdownMenuItem>
        ) : (
          projects.map((project) => (
            <DropdownMenuItem
              key={project.id}
              onClick={() => onProjectSelect(project)}
              className="cursor-pointer"
            >
              <div className="flex flex-col gap-1 w-full">
                <span className="font-medium">{project.name}</span>
                <span className="text-xs text-muted-foreground truncate">
                  {project.repo_link}
                </span>
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
