# UI Project Status - Decision Log

**Status:** Foundation Complete, Components In Progress
**Last Updated:** 2025-11-10
**Dev Server:** http://localhost:3002

---

## ✅ Completed Components

### Layout Components
- [x] `components/layout/Header.tsx` - Sticky header with navigation and mobile menu
- [x] `components/layout/Sidebar.tsx` - Collapsible sidebar with nav links
- [x] `components/layout/Footer.tsx` - Minimal footer with links

### UI Components (Reusable)
- [x] `components/ui/Button.tsx` - Button with variants (primary/pink, secondary, ghost, danger)
- [x] `components/ui/Badge.tsx` - Badge for tags, categories, status
- [x] `components/ui/Chip.tsx` - Selected filter chips with remove button
- [x] `components/ui/EmptyState.tsx` - Empty state with icon and CTA
- [x] `components/ui/LoadingSpinner.tsx` - Minimal loading indicator
- [x] `components/ui/ErrorBoundary.tsx` - Error boundary wrapper

### Decision Components
- [x] `components/decisions/DecisionCard.tsx` - Card for list view with outcome icons, metadata

### Utilities & Hooks
- [x] `lib/utils/cn.ts` - Tailwind class merger
- [x] `lib/utils/formatting.ts` - Date, text, number formatting utilities
- [x] `lib/utils/form-validation.ts` - Form field validation functions
- [x] `lib/hooks/useMediaQuery.ts` - Responsive media query hook
- [x] `lib/api/client.ts` - Frontend API client with error handling

### Styles & Configuration
- [x] `app/globals.css` - Complete design system with:
  - Soft pink accent color (#F5B5C5)
  - Black & white base
  - Focus states (pink outline)
  - Selection styles (light pink)
  - Custom scrollbar
  - Animations

### Pages
- [x] `app/layout.tsx` - Root layout with Header/Footer
- [x] `app/page.tsx` - Home/Dashboard page with:
  - Stats cards (Total, This Month, Success Rate, Flagged)
  - Recent decisions list
  - Quick actions
  - Beautiful minimal design

---

## 🚧 Components To Build

### Filter Components (Priority: High)
**Location:** `components/filters/`

These are needed for the decisions list page with search/filter functionality:

- [ ] `SearchInput.tsx` - Text search with debounce
  ```typescript
  interface SearchInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
  }
  ```

- [ ] `CategoryFilter.tsx` - Dropdown for category selection
  ```typescript
  interface CategoryFilterProps {
    value?: DecisionCategory;
    onChange: (category: DecisionCategory | undefined) => void;
    categories: DecisionCategory[];
  }
  ```

- [ ] `ProjectFilter.tsx` - Dropdown for project selection
- [ ] `TagFilter.tsx` - Multi-select for tags
- [ ] `ConfidenceFilter.tsx` - Range slider or min/max inputs
- [ ] `OutcomeFilter.tsx` - Radio buttons (all, pending, success, failed)
- [ ] `SortDropdown.tsx` - Sort options dropdown
- [ ] `FilterPanel.tsx` - Container combining all filters

**Pattern to follow:**
```typescript
// Example: CategoryFilter.tsx
export function CategoryFilter({ value, onChange, categories }: CategoryFilterProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">Category</label>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value as DecisionCategory)}
        className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#F5B5C5]"
      >
        <option value="">All Categories</option>
        {categories.map((cat) => (
          <option key={cat} value={cat}>{formatCategory(cat)}</option>
        ))}
      </select>
    </div>
  );
}
```

### Decision Components (Priority: High)
**Location:** `components/decisions/`

- [ ] `DecisionList.tsx` - List container with pagination
  ```typescript
  interface DecisionListProps {
    decisions: Decision[];
    isLoading: boolean;
    hasMore: boolean;
    onLoadMore: () => void;
  }
  ```

- [ ] `DecisionDetail.tsx` - Full decision view (read-only)
  - Two-column layout (content + metadata sidebar)
  - All fields displayed nicely
  - Links to similar decisions

- [ ] `DecisionForm.tsx` - Create/edit form
  - Sections: Context, Decision Details, Analysis, Reflection
  - Validation with inline errors
  - Auto-save indicator
  - Character counts on textareas

- [ ] `OutcomeForm.tsx` - Modal to add outcome
  - Success toggle
  - Outcome textarea
  - Date picker
  - Lessons learned field

**Pattern to follow:**
```typescript
// Example: DecisionList.tsx
export function DecisionList({ decisions, isLoading, hasMore, onLoadMore }: DecisionListProps) {
  if (isLoading) {
    return <LoadingSpinner size="lg" text="Loading decisions..." />;
  }

  if (decisions.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No decisions found"
        description="Try adjusting your filters or create a new decision."
      />
    );
  }

  return (
    <div className="space-y-4">
      {decisions.map((decision) => (
        <DecisionCard key={decision.id} decision={decision} />
      ))}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button onClick={onLoadMore}>Load More</Button>
        </div>
      )}
    </div>
  );
}
```

### Pages (Priority: Medium)
**Location:** `app/decisions/`

- [ ] `/decisions/page.tsx` - List page with filters
  - FilterPanel in sidebar
  - DecisionList in main area
  - Search results count
  - Responsive (filters in modal on mobile)

- [ ] `/decisions/[id]/page.tsx` - Detail page
  - DecisionDetail component
  - Edit/Delete/Flag buttons
  - Add Outcome button

- [ ] `/decisions/new/page.tsx` - Create page
  - DecisionForm in create mode
  - Redirect to detail on success

- [ ] `/decisions/[id]/edit/page.tsx` - Edit page
  - DecisionForm in edit mode
  - Pre-filled with existing data

- [ ] `/analytics/page.tsx` - Analytics dashboard (Phase 2)
  - Stats cards
  - Charts (use recharts)
  - Pattern insights

### Documentation (Priority: Low)
**Location:** `docs/`

- [ ] `UI_DESIGN.md` - Design system documentation
- [ ] `COMPONENT_GUIDE.md` - How to use each component
- [ ] `STYLING_GUIDE.md` - Tailwind conventions

---

## 🎨 Design System Summary

### Colors
- **Base:** #000000 (black), #FFFFFF (white)
- **Accent:** #F5B5C5 (soft pink) - USED SPARINGLY
  - Primary CTA buttons
  - Active/selected states
  - Focus outlines
  - Hover states on important actions
- **Grays:** #f5f5f5 (light), #e5e5e5 (border), #737373 (text secondary)

### Typography
- **Font:** Geist Sans (--font-geist-sans)
- **Headings:** Bold, generous whitespace
- **Body:** Regular, line-height 1.6
- **Small:** text-sm for metadata

### Spacing
- Scale: 4, 8, 12, 16, 24, 32, 48, 64px
- Use Tailwind's spacing scale consistently

### Components Style
- **Borders:** 1px solid #e5e5e5 (not black, not pink)
- **Shadows:** Minimal (shadow-sm on cards only)
- **Radius:** rounded-md (6px) for buttons, rounded-lg (8px) for cards
- **Transitions:** 200ms for most interactions

### Responsive
- **Mobile:** < 640px - Stack vertically
- **Tablet:** 640-1024px - Compact layout
- **Desktop:** > 1024px - Full layout with sidebar

---

## 📝 Code Patterns

### Component Structure
```typescript
// 1. Imports
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils/cn';

// 2. Types
interface ComponentProps {
  className?: string;
  // ... other props
}

// 3. Component
export function Component({ className }: ComponentProps) {
  // 4. State
  const [isOpen, setIsOpen] = useState(false);

  // 5. Handlers
  const handleClick = () => {
    setIsOpen(!isOpen);
  };

  // 6. Render
  return (
    <div className={cn('base-classes', className)}>
      {/* Content */}
    </div>
  );
}
```

### API Integration
```typescript
import { apiGet } from '@/lib/api/client';
import { Decision } from '@/lib/types/decisions';

// In component
const [decisions, setDecisions] = useState<Decision[]>([]);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  async function fetchDecisions() {
    try {
      setIsLoading(true);
      const data = await apiGet<{ decisions: Decision[] }>('/api/decisions');
      setDecisions(data.decisions);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  fetchDecisions();
}, []);
```

### Form Handling
```typescript
import { useState } from 'react';
import { validateTitle } from '@/lib/utils/form-validation';

const [formData, setFormData] = useState({ title: '' });
const [errors, setErrors] = useState<Record<string, string>>({});

const handleChange = (field: string, value: any) => {
  setFormData((prev) => ({ ...prev, [field]: value }));

  // Clear error when typing
  if (errors[field]) {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }
};

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  // Validate
  const titleValidation = validateTitle(formData.title);
  if (!titleValidation.valid) {
    setErrors({ title: titleValidation.error! });
    return;
  }

  // Submit
  try {
    await apiPost('/api/decisions', formData);
    // Success
  } catch (err) {
    // Error
  }
};
```

---

## 🚀 Next Steps

### Immediate (To make app functional)
1. Create filter components (SearchInput, CategoryFilter, etc.)
2. Create DecisionList component
3. Create /decisions/page.tsx with filters
4. Create DecisionForm component
5. Create /decisions/new/page.tsx

### Short-term (Full CRUD)
6. Create DecisionDetail component
7. Create /decisions/[id]/page.tsx
8. Create /decisions/[id]/edit/page.tsx
9. Create OutcomeForm modal
10. Hook up real API data (replace mock data)

### Medium-term (Polish)
11. Add loading skeletons
12. Add toast notifications
13. Add keyboard shortcuts
14. Improve mobile experience
15. Add page transitions

### Long-term (Analytics)
16. Create analytics page with charts
17. Add insights and patterns
18. Add export functionality

---

## 🎯 Key Files Reference

### Types
- `lib/types/decisions.ts` - Decision type definitions
- `lib/types/search.ts` - Search/filter types

### API Hooks (Already built)
- `lib/hooks/useDecisions.ts` - Hook for fetching decisions
- `lib/hooks/useSearch.ts` - Hook for search/filter state

### API Routes (Already built)
- `app/api/decisions/route.ts` - GET (list), POST (create)
- `app/api/decisions/[id]/route.ts` - GET, PUT, DELETE
- `app/api/decisions/[id]/outcome/route.ts` - PATCH (add outcome)

---

## 💡 Tips

### When building new components:

1. **Start with types** - Define props interface first
2. **Keep it minimal** - Black/white base, pink accents sparingly
3. **Use existing utilities** - cn(), formatting helpers, validation
4. **Follow patterns** - Look at existing components for consistency
5. **Test responsive** - Check mobile (< 640px), tablet, desktop
6. **Accessibility** - ARIA labels, keyboard nav, focus states

### Tailwind classes to use often:
- Layout: `flex`, `grid`, `space-y-4`, `gap-6`
- Spacing: `p-6`, `px-4`, `py-2`, `mb-4`
- Text: `text-sm`, `text-gray-600`, `font-semibold`
- Borders: `border border-gray-200`, `rounded-lg`
- Hover: `hover:border-gray-300`, `hover:bg-gray-50`
- Transitions: `transition-colors`, `duration-200`

### Pink accent usage (sparingly!):
- Primary button: `bg-[#F5B5C5] hover:bg-[#E8AFBE]`
- Active filter: `border-[#F5B5C5]`
- Focus ring: `focus:ring-[#F5B5C5]`
- Selected state: `bg-[#FFF5F8] border-[#F5B5C5]`

---

## 📦 Dependencies

Already installed:
- ✅ next@16.0.1
- ✅ react@19.2.0
- ✅ tailwindcss@4
- ✅ lucide-react (icons)
- ✅ class-variance-authority (Button variants)
- ✅ clsx, tailwind-merge (cn utility)

May need for advanced features:
- [ ] recharts (for analytics charts)
- [ ] react-hook-form (for complex forms)
- [ ] date-fns (for advanced date handling)

---

## 🐛 Known Issues

None currently - foundation is solid!

---

## 📞 Support

- Check `docs/` folder for detailed guides
- Look at existing components for patterns
- All backend APIs are working and documented

Happy building! The design system is set up, foundation is solid, and you're ready to build the remaining components. 🎨✨
