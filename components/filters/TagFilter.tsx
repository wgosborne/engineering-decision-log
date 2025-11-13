'use client';

// ============================================================================
// TAG FILTER COMPONENT
// ============================================================================
// Purpose: Tag-based filter with pill-style selection
// Used in: FilterPanel component
// Features: Dynamically loads tags, visual pill display, add/remove tags
// ============================================================================

import { cn } from '@/lib/utils/cn';
import { X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { apiGet } from '@/lib/api/client';
import { Badge } from '@/components/ui/Badge';
import { getTagColor } from '@/lib/utils/colors';

interface TagFilterProps {
  value: string[];
  onChange: (tags: string[]) => void;
  className?: string;
}

export function TagFilter({ value, onChange, className }: TagFilterProps) {
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchTags() {
      try {
        // Fetch decisions and extract unique tags
        const data = await apiGet<{ decisions: Array<{ tags: string[] }> }>(
          '/api/decisions?limit=100'
        );
        const allTags = data.decisions.flatMap((d) => d.tags);
        const uniqueTags = Array.from(new Set(allTags)).sort();
        setAvailableTags(uniqueTags);
      } catch (error) {
        console.error('Failed to fetch tags:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTags();
  }, []);

  const handleAddTag = (tag: string) => {
    if (tag && !value.includes(tag)) {
      onChange([...value, tag]);
      setInputValue('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      handleAddTag(inputValue.trim());
    }
  };

  const filteredTags = availableTags.filter(
    (tag) =>
      tag.toLowerCase().includes(inputValue.toLowerCase()) && !value.includes(tag)
  );

  return (
    <div className={cn('space-y-2', className)}>
      <label htmlFor="tag-filter" className="block text-sm font-medium text-gray-700">
        Tags
      </label>

      {/* Selected tags */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {value.map((tag) => (
            <div key={tag} className="inline-flex items-center gap-1">
              <Badge variant={getTagColor(tag)} size="sm">
                {tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:opacity-70 transition-opacity"
                  aria-label={`Remove ${tag}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="relative">
        <input
          id="tag-filter"
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isLoading ? 'Loading...' : 'Type to search tags...'}
          disabled={isLoading}
          className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#F5B5C5] transition-colors"
        />

        {/* Dropdown with suggestions */}
        {inputValue && filteredTags.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-auto">
            {filteredTags.slice(0, 10).map((tag) => (
              <button
                key={tag}
                onClick={() => handleAddTag(tag)}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
