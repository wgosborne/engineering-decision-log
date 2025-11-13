'use client';

// ============================================================================
// QUICK DECISION ENTRY COMPONENT
// ============================================================================
// Purpose: Fast entry form for capturing decision basics on home page
// Used in: Home page (top of page)
// Features: Title, category, chosen option, reasoning fields
// Behavior: Expands to full form when "Continue & Save" is clicked
// ============================================================================

import { useState } from 'react';
import { DecisionCategory, CATEGORY_LABELS } from '@/lib/types/decisions';
import { cn } from '@/lib/utils/cn';

interface QuickDecisionEntryProps {
  onExpand: (data: {
    title: string;
    category: DecisionCategory;
    chosen_option: string;
    reasoning: string;
  }) => void;
  className?: string;
}

export function QuickDecisionEntry({ onExpand, className }: QuickDecisionEntryProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<DecisionCategory>(DecisionCategory.Other);
  const [chosenOption, setChosenOption] = useState('');
  const [reasoning, setReasoning] = useState('');

  const handleExpand = () => {
    // Only expand if at least title is filled
    if (title.trim()) {
      onExpand({
        title: title.trim(),
        category,
        chosen_option: chosenOption.trim(),
        reasoning: reasoning.trim(),
      });
      // Clear the form
      setTitle('');
      setCategory(DecisionCategory.Other);
      setChosenOption('');
      setReasoning('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, field: string) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (field === 'title' && title.trim()) {
        // Move to next field or expand
        document.getElementById('quick-category')?.focus();
      } else if (field === 'category') {
        document.getElementById('quick-option')?.focus();
      } else if (field === 'option') {
        document.getElementById('quick-reasoning')?.focus();
      } else if (field === 'reasoning') {
        handleExpand();
      }
    }
  };

  return (
    <div className={cn('bg-white border-2 border-gray-200 rounded-lg p-4 space-y-3 hover:border-gray-400 transition-colors', className)}>
      {/* Title */}
      <input
        id="quick-title"
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => handleKeyDown(e, 'title')}
        placeholder="Decision title..."
        className="w-full px-3 py-2 text-sm font-medium placeholder:text-gray-400 border-0 focus:outline-none focus:ring-0"
      />

      {/* Category & Option on same line */}
      <div className="grid grid-cols-2 gap-3">
        <select
          id="quick-category"
          value={category}
          onChange={(e) => setCategory(e.target.value as DecisionCategory)}
          onKeyDown={(e) => handleKeyDown(e, 'category')}
          className="px-3 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] bg-white"
        >
          {Object.values(DecisionCategory).map((cat) => (
            <option key={cat} value={cat}>
              {CATEGORY_LABELS[cat]}
            </option>
          ))}
        </select>

        <input
          id="quick-option"
          type="text"
          value={chosenOption}
          onChange={(e) => setChosenOption(e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, 'option')}
          placeholder="What did you choose?"
          className="px-3 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#DA70D6]"
        />
      </div>

      {/* Reasoning */}
      <textarea
        id="quick-reasoning"
        value={reasoning}
        onChange={(e) => setReasoning(e.target.value)}
        onKeyDown={(e) => handleKeyDown(e, 'reasoning')}
        placeholder="Brief reasoning..."
        rows={2}
        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF99C8] resize-none"
      />

      {/* Action button */}
      <button
        onClick={handleExpand}
        disabled={!title.trim()}
        className="w-full px-4 py-2 text-sm font-medium text-white bg-pink-500 rounded-md hover:bg-pink-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        {title.trim() ? 'Continue & Save Decision' : 'Enter a title to continue'}
      </button>
    </div>
  );
}
