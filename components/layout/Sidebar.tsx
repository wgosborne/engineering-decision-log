'use client';

// ============================================================================
// SIDEBAR COMPONENT
// ============================================================================
// Purpose: Collapsible sidebar for navigation and filters
// Responsive: Hidden on mobile, slide-out panel
// ============================================================================

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, FileText, BarChart3, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface SidebarProps {
  className?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ className, isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/decisions', label: 'Decisions', icon: FileText },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && onClose && (
        <div
          className="fixed inset-0 bg-black/20 md:hidden z-40"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed md:sticky top-0 left-0 z-50 h-screen w-64 bg-white border-r border-gray-200 transition-transform duration-200',
          'md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          className
        )}
      >
        <div className="flex flex-col h-full p-6">
          {/* Mobile close button */}
          {onClose && (
            <button
              onClick={onClose}
              className="self-end mb-4 md:hidden p-2 text-gray-600 hover:text-black transition-colors"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          )}

          {/* New Decision button */}
          <Link
            href="/decisions/new"
            className="inline-flex items-center justify-center gap-2 w-full px-4 py-3 mb-8 text-sm font-medium text-white bg-[#F5B5C5] rounded-md hover:bg-[#E8AFBE] transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Decision
          </Link>

          {/* Navigation */}
          <nav className="flex-1 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'text-black bg-gray-100 border-l-2 border-[#F5B5C5]'
                      : 'text-gray-600 hover:text-black hover:bg-gray-50'
                  )}
                  onClick={onClose}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Footer info */}
          <div className="pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Track and analyze your decision-making patterns
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
