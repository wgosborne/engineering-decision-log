'use client';

// ============================================================================
// HEADER COMPONENT
// ============================================================================
// Purpose: Sticky header with logo, navigation, and search
// Responsive: Collapses to mobile menu on small screens
// ============================================================================

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils/cn';

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/decisions', label: 'Decisions' },
    { href: '/analytics', label: 'Analytics' },
  ];

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full bg-white border-b border-gray-200',
        className
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="text-xl font-bold text-black hover:opacity-70 transition-opacity"
            >
              Decision Log
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'text-sm font-medium transition-colors',
                      isActive
                        ? 'text-black border-b-2 border-[#FF99C8] pb-[2px]'
                        : 'text-gray-600 hover:text-black'
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right side - Desktop */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/decisions/new"
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-[#FF99C8] rounded-md hover:bg-[#FF80B8] transition-colors"
            >
              New Decision
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className="md:hidden p-2 text-gray-600 hover:text-black transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <nav className="flex flex-col px-4 py-4 space-y-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'text-black bg-gray-100'
                      : 'text-gray-600 hover:text-black hover:bg-gray-50'
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              );
            })}
            <Link
              href="/decisions/new"
              className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-white bg-[#FF99C8] rounded-md hover:bg-[#FF80B8] transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              New Decision
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
