'use client';

// ============================================================================
// PROJECT FILTER COMPONENT
// ============================================================================
// Purpose: Multi-select checkbox filter for projects
// Used in: FilterPanel component
// Features: Dynamically loads projects from API, shows decision counts
// ============================================================================

import { cn } from '@/lib/utils/cn';
import { useState, useEffect } from 'react';
import { apiGet } from '@/lib/api/client';

interface ProjectFilterProps {
  value?: string;
  onChange: (project: string | undefined) => void;
  className?: string;
}

export function ProjectFilter({
  value,
  onChange,
  className,
}: ProjectFilterProps) {
  const [projects, setProjects] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchProjects() {
      try {
        // Fetch decisions and extract unique project names
        const data = await apiGet<{ decisions: Array<{ project_name: string | null }> }>(
          '/api/decisions?limit=100'
        );
        const uniqueProjects = Array.from(
          new Set(
            data.decisions
              .map((d) => d.project_name)
              .filter((p): p is string => p !== null)
          )
        ).sort();
        setProjects(uniqueProjects);
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProjects();
  }, []);

  if (isLoading) {
    return (
      <div className={cn('space-y-2', className)}>
        <label className="block text-sm font-medium text-gray-700">Project</label>
        <div className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-400">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      <label
        htmlFor="project-filter"
        className="block text-sm font-medium text-gray-700"
      >
        Project
      </label>
      <select
        id="project-filter"
        value={value || ''}
        onChange={(e) => onChange(e.target.value || undefined)}
        className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#F5B5C5] transition-colors bg-white"
      >
        <option value="">All Projects</option>
        {projects.map((project) => (
          <option key={project} value={project}>
            {project}
          </option>
        ))}
      </select>
    </div>
  );
}
