'use client';

// ============================================================================
// PROJECT NOTEBOOKS COMPONENT
// ============================================================================
// Purpose: Visual notebook-style tab system for filtering decisions by project
// Used in: Home page (above decision grid)
// Features: Color-coded project cards, entry counts, recent timestamps, hover effects
// Interaction: Click a project to filter decisions, click "All Decisions" to reset
// ============================================================================

import { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { BookOpen, Folder, Calendar } from 'lucide-react';

interface ProjectNotebook {
  name: string;
  count: number;
  color: string;
  recentDate?: string;
}

interface ProjectNotebooksProps {
  projects: ProjectNotebook[];
  selectedProject: string | null;
  onProjectSelect: (project: string | null) => void;
  className?: string;
}

const NOTEBOOK_COLORS = [
  { bg: 'bg-[#FFF5FA]', border: 'border-[#FF99C8]', text: 'text-[#FF80B8]', accent: 'bg-[#FF99C8]' }, // pink
  { bg: 'bg-[#F3EFFF]', border: 'border-[#8B5CF6]', text: 'text-[#8B5CF6]', accent: 'bg-[#8B5CF6]' }, // violet
  { bg: 'bg-[#FDF4FF]', border: 'border-[#DA70D6]', text: 'text-[#DA70D6]', accent: 'bg-[#DA70D6]' }, // orchid
  { bg: 'bg-[#F0FDFA]', border: 'border-[#14B8A6]', text: 'text-[#14B8A6]', accent: 'bg-[#14B8A6]' }, // teal
  { bg: 'bg-[#F0F9FF]', border: 'border-[#0EA5E9]', text: 'text-[#0EA5E9]', accent: 'bg-[#0EA5E9]' }, // sky
  { bg: 'bg-[#ECFDF5]', border: 'border-[#10B981]', text: 'text-[#10B981]', accent: 'bg-[#10B981]' }, // emerald
  { bg: 'bg-[#FFF5F5]', border: 'border-[#FF6B6B]', text: 'text-[#FF6B6B]', accent: 'bg-[#FF6B6B]' }, // coral
  { bg: 'bg-[#FFF1F2]', border: 'border-[#FB7185]', text: 'text-[#FB7185]', accent: 'bg-[#FB7185]' }, // rose
  { bg: 'bg-[#FFFBEB]', border: 'border-[#F59E0B]', text: 'text-[#F59E0B]', accent: 'bg-[#F59E0B]' }, // amber
];

export function ProjectNotebooks({
  projects,
  selectedProject,
  onProjectSelect,
  className,
}: ProjectNotebooksProps) {
  const [hoveredProject, setHoveredProject] = useState<string | null>(null);

  return (
    <div className={cn('mb-8', className)}>
      {/* Notebook Shelf */}
      <div className="relative">
        {/* Shelf Line */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />

        {/* Notebooks */}
        <div className="flex items-end gap-3 pb-3 overflow-x-auto hide-scrollbar">
          {/* All Decisions Notebook */}
          <button
            onClick={() => onProjectSelect(null)}
            onMouseEnter={() => setHoveredProject('all')}
            onMouseLeave={() => setHoveredProject(null)}
            className={cn(
              'relative flex flex-col min-w-[180px] group transition-all duration-200',
              selectedProject === null ? 'mb-0.5' : 'hover:mb-0.5'
            )}
          >
            {/* Notebook Card */}
            <div
              className={cn(
                'relative w-full h-20 rounded-lg border transition-all duration-200',
                selectedProject === null
                  ? 'bg-white border-gray-400 shadow-md'
                  : 'bg-gray-50 border-gray-200 shadow-sm hover:shadow-md'
              )}
            >
              {/* Selected Stripe */}
              {selectedProject === null && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#8B5CF6] rounded-l-lg" />
              )}

              {/* Content */}
              <div className="flex flex-col justify-center h-full px-4 pl-5">
                <div
                  className={cn(
                    'text-sm font-bold mb-1',
                    selectedProject === null ? 'text-gray-900' : 'text-gray-600'
                  )}
                >
                  All Decisions
                </div>
                <div className="text-xs text-gray-500">
                  {projects.reduce((sum, p) => sum + p.count, 0)} entries
                </div>
              </div>
            </div>
          </button>

          {/* Project Notebooks */}
          {projects.map((project, index) => {
            const colorScheme = NOTEBOOK_COLORS[index % NOTEBOOK_COLORS.length];
            const isSelected = selectedProject === project.name;
            const isHovered = hoveredProject === project.name;

            return (
              <button
                key={project.name}
                onClick={() => onProjectSelect(project.name)}
                onMouseEnter={() => setHoveredProject(project.name)}
                onMouseLeave={() => setHoveredProject(null)}
                className={cn(
                  'relative flex flex-col min-w-[180px] group transition-all duration-200',
                  isSelected ? 'mb-0.5' : 'hover:mb-0.5'
                )}
              >
                {/* Notebook Card */}
                <div
                  className={cn(
                    'relative w-full h-20 rounded-lg border transition-all duration-200',
                    isSelected
                      ? `bg-white ${colorScheme.border} shadow-md`
                      : `${colorScheme.bg} border-gray-200 shadow-sm hover:shadow-md`
                  )}
                >
                  {/* Selected Stripe */}
                  {isSelected && (
                    <div className={cn('absolute left-0 top-0 bottom-0 w-1 rounded-l-lg', colorScheme.accent)} />
                  )}

                  {/* Content */}
                  <div className="flex flex-col justify-center h-full px-4 pl-5">
                    <div
                      className={cn(
                        'text-sm font-bold mb-1 line-clamp-1',
                        isSelected ? colorScheme.text : 'text-gray-700'
                      )}
                      title={project.name}
                    >
                      {project.name}
                    </div>
                    <div className="text-xs text-gray-600">
                      {project.count} {project.count === 1 ? 'entry' : 'entries'}
                    </div>
                    {project.recentDate && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                        <Calendar className="h-3 w-3" />
                        {project.recentDate}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Scrollbar Hide */}
      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
