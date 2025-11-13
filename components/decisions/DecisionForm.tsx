'use client';

// ============================================================================
// DECISION FORM COMPONENT
// ============================================================================
// Purpose: Comprehensive form for creating and editing decisions
// Used in: New decision page, edit decision page, home page slide-over
// Features: All decision fields, project autocomplete, validation, delete button
// Modes: 'create' for new decisions, 'edit' for updating existing ones
// ============================================================================

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Decision,
  DecisionCategory,
  DecisionType,
  OptimizedFor,
  DecisionOption,
  CATEGORY_LABELS,
  OPTIMIZED_FOR_LABELS,
} from '@/lib/types/decisions';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { AutocompleteInput } from '@/components/ui/AutocompleteInput';
import { cn } from '@/lib/utils/cn';
import { validateDecisionForm, hasErrors } from '@/lib/utils/form-validation';
import { apiPost, apiPut, apiGet, apiDelete, ApiError } from '@/lib/api/client';
import { X, Plus, Save, Loader2, Trash2 } from 'lucide-react';
import { getTagColor } from '@/lib/utils/colors';

interface DecisionFormProps {
  decision?: Decision;
  mode: 'create' | 'edit';
  onSuccess?: (decision: Decision) => void;
  onCancel?: () => void;
  onDelete?: () => void;
  className?: string;
}

type FormData = Partial<Decision> & {
  options_considered: DecisionOption[];
};

export function DecisionForm({
  decision,
  mode,
  onSuccess,
  onCancel,
  onDelete,
  className,
}: DecisionFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>(
    decision || {
      title: '',
      business_context: '',
      problem_statement: '',
      chosen_option: '',
      reasoning: '',
      confidence_level: 5,
      category: DecisionCategory.Other,
      project_name: '',
      tags: [],
      optimized_for: [],
      tradeoffs_accepted: [],
      tradeoffs_rejected: [],
      options_considered: [],
      stakeholders: [],
      decision_type: DecisionType.SomewhatReversible,
      assumptions: [],
      invalidation_conditions: [],
      next_review_date: null,
      revisit_reason: null,
      flagged_for_review: false,
      notes: '',
      similar_decision_ids: [],
      related_decision_ids: [],
      similarity_notes: [],
    }
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [existingProjects, setExistingProjects] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch existing projects for autocomplete
  useEffect(() => {
    async function fetchProjects() {
      try {
        const projects = await apiGet<string[]>('/api/projects');
        setExistingProjects(projects);
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      }
    }
    fetchProjects();
  }, []);

  const handleChange = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleArrayAdd = (field: keyof FormData, value: string) => {
    if (!value.trim()) return;
    const currentArray = (formData[field] as string[]) || [];
    setFormData((prev) => ({
      ...prev,
      [field]: [...currentArray, value.trim()],
    }));
  };

  const handleArrayRemove = (field: keyof FormData, index: number) => {
    const currentArray = (formData[field] as string[]) || [];
    setFormData((prev) => ({
      ...prev,
      [field]: currentArray.filter((_, i) => i !== index),
    }));
  };

  const handleOptionAdd = () => {
    setFormData((prev) => ({
      ...prev,
      options_considered: [
        ...(prev.options_considered || []),
        { name: '', description: '', pros: [], cons: [] },
      ],
    }));
  };

  const handleOptionRemove = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      options_considered: prev.options_considered.filter((_, i) => i !== index),
    }));
  };

  const handleOptionChange = (index: number, field: keyof DecisionOption, value: any) => {
    const options = [...(formData.options_considered || [])];
    options[index] = { ...options[index], [field]: value };
    setFormData((prev) => ({ ...prev, options_considered: options }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // Prepare data - different handling for create vs edit
    let submissionData: any = { ...formData };

    if (mode === 'create') {
      // For create, set defaults for optional fields
      submissionData.business_context = formData.business_context?.trim() || 'N/A';
      submissionData.problem_statement = formData.problem_statement?.trim() || 'N/A';
    } else {
      // For edit, only include fields that have meaningful content
      // Remove protected fields
      const { id, date_created, date_updated, search_vector, ...cleanData } = submissionData;
      submissionData = cleanData;

      // Only include business_context and problem_statement if they have sufficient content
      if (submissionData.business_context && submissionData.business_context.trim().length < 20) {
        delete submissionData.business_context;
      }
      if (submissionData.problem_statement && submissionData.problem_statement.trim().length < 20) {
        delete submissionData.problem_statement;
      }
    }

    // Validate form (only for create mode, edit validation happens server-side)
    if (mode === 'create') {
      const validationErrors = validateDecisionForm(submissionData);
      if (hasErrors(validationErrors)) {
        setErrors(validationErrors);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      let result: Decision;
      if (mode === 'create') {
        result = await apiPost<Decision>('/api/decisions', submissionData);
      } else {
        result = await apiPut<Decision>(`/api/decisions/${decision?.id}`, submissionData);
      }

      if (onSuccess) {
        onSuccess(result);
      } else {
        router.push(`/decisions/${result.id}`);
      }
    } catch (error) {
      if (error instanceof ApiError) {
        setSubmitError(error.message);
      } else {
        setSubmitError('An unexpected error occurred');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!decision?.id) return;

    const confirmed = window.confirm(
      'Are you sure you want to delete this decision? This action cannot be undone.'
    );

    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await apiDelete(`/api/decisions/${decision.id}`);
      if (onDelete) {
        onDelete();
      } else {
        router.push('/decisions');
      }
    } catch (error) {
      if (error instanceof ApiError) {
        setSubmitError(error.message);
      } else {
        setSubmitError('Failed to delete decision');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn('max-w-4xl mx-auto space-y-8', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">
          {mode === 'create' ? 'Create Decision' : 'Edit Decision'}
        </h1>
        <div className="flex items-center gap-2">
          {mode === 'edit' && onDelete && (
            <Button
              type="button"
              variant="danger"
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center gap-2"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Delete
                </>
              )}
            </Button>
          )}
          {onCancel && (
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            className="flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {mode === 'create' ? 'Create' : 'Save'}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Error message */}
      {submitError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{submitError}</p>
        </div>
      )}

      {/* Section 1: Basic Info */}
      <section className="border border-gray-200 rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold">Basic Information</h2>

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            type="text"
            value={formData.title || ''}
            onChange={(e) => handleChange('title', e.target.value)}
            className={cn(
              'w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FF99C8]',
              errors.title ? 'border-red-300' : 'border-gray-200'
            )}
            placeholder="Brief, descriptive title"
          />
          {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title}</p>}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              id="category"
              value={formData.category || ''}
              onChange={(e) => handleChange('category', e.target.value as DecisionCategory)}
              className={cn(
                'w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FF99C8] bg-white',
                errors.category ? 'border-red-300' : 'border-gray-200'
              )}
            >
              {Object.values(DecisionCategory).map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_LABELS[cat]}
                </option>
              ))}
            </select>
            {errors.category && <p className="text-xs text-red-600 mt-1">{errors.category}</p>}
          </div>

          <div>
            <label htmlFor="project_name" className="block text-sm font-medium text-gray-700 mb-1">
              Project Name <span className="text-red-500">*</span>
            </label>
            <AutocompleteInput
              id="project_name"
              value={formData.project_name || ''}
              onChange={(value) => handleChange('project_name', value)}
              suggestions={existingProjects}
              placeholder="Type to search or enter new project"
              error={!!errors.project_name}
              required
            />
            {errors.project_name && (
              <p className="text-xs text-red-600 mt-1">{errors.project_name}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
            Tags
            <span className="text-xs text-gray-500 ml-2">(Type and press Enter to add)</span>
          </label>
          <div className="flex gap-2">
            <input
              id="tags"
              type="text"
              placeholder="Add a tag and press Enter"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleArrayAdd('tags', e.currentTarget.value);
                  e.currentTarget.value = '';
                }
              }}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
            />
          </div>
          {formData.tags && formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.tags.map((tag, index) => (
                <Badge
                  key={index}
                  variant={getTagColor(tag)}
                  size="sm"
                  className="cursor-pointer"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleArrayRemove('tags', index)}
                    className="ml-1 hover:opacity-70"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Section 2: Context */}
      <section className="border border-gray-200 rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold">Context</h2>

        <div>
          <label
            htmlFor="business_context"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Business Context
          </label>
          <textarea
            id="business_context"
            value={formData.business_context || ''}
            onChange={(e) => handleChange('business_context', e.target.value)}
            rows={4}
            className={cn(
              'w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FF99C8]',
              errors.business_context ? 'border-red-300' : 'border-gray-200'
            )}
            placeholder="What's the situation? Why is this decision needed?"
          />
          {errors.business_context && (
            <p className="text-xs text-red-600 mt-1">{errors.business_context}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="problem_statement"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Problem Statement
          </label>
          <textarea
            id="problem_statement"
            value={formData.problem_statement || ''}
            onChange={(e) => handleChange('problem_statement', e.target.value)}
            rows={4}
            className={cn(
              'w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FF99C8]',
              errors.problem_statement ? 'border-red-300' : 'border-gray-200'
            )}
            placeholder="What specific problem are you solving?"
          />
          {errors.problem_statement && (
            <p className="text-xs text-red-600 mt-1">{errors.problem_statement}</p>
          )}
        </div>

        <div>
          <label htmlFor="stakeholders" className="block text-sm font-medium text-gray-700 mb-1">
            Stakeholders
          </label>
          <input
            id="stakeholders"
            type="text"
            placeholder="Add stakeholder and press Enter"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleArrayAdd('stakeholders', e.currentTarget.value);
                e.currentTarget.value = '';
              }
            }}
            className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FF99C8]"
          />
          {formData.stakeholders && formData.stakeholders.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.stakeholders.map((stakeholder, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs"
                >
                  {stakeholder}
                  <button
                    type="button"
                    onClick={() => handleArrayRemove('stakeholders', index)}
                    className="text-gray-600 hover:text-black"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Section 3: Decision Details */}
      <section className="border border-gray-200 rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold">Decision Details</h2>

        <div>
          <label htmlFor="chosen_option" className="block text-sm font-medium text-gray-700 mb-1">
            Chosen Option <span className="text-red-500">*</span>
          </label>
          <input
            id="chosen_option"
            type="text"
            value={formData.chosen_option || ''}
            onChange={(e) => handleChange('chosen_option', e.target.value)}
            className={cn(
              'w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FF99C8]',
              errors.chosen_option ? 'border-red-300' : 'border-gray-200'
            )}
            placeholder="What did you decide?"
          />
          {errors.chosen_option && (
            <p className="text-xs text-red-600 mt-1">{errors.chosen_option}</p>
          )}
        </div>

        <div>
          <label htmlFor="reasoning" className="block text-sm font-medium text-gray-700 mb-1">
            Reasoning <span className="text-red-500">*</span>
          </label>
          <textarea
            id="reasoning"
            value={formData.reasoning || ''}
            onChange={(e) => handleChange('reasoning', e.target.value)}
            rows={5}
            className={cn(
              'w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FF99C8]',
              errors.reasoning ? 'border-red-300' : 'border-gray-200'
            )}
            placeholder="Why did you choose this option?"
          />
          {errors.reasoning && <p className="text-xs text-red-600 mt-1">{errors.reasoning}</p>}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="confidence_level"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Confidence Level
            </label>
            <select
              id="confidence_level"
              value={formData.confidence_level || 5}
              onChange={(e) => handleChange('confidence_level', parseInt(e.target.value, 10))}
              className={cn(
                'w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FF99C8] bg-white',
                errors.confidence_level ? 'border-red-300' : 'border-gray-200'
              )}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <option key={num} value={num}>
                  {num}/10
                </option>
              ))}
            </select>
            {errors.confidence_level && (
              <p className="text-xs text-red-600 mt-1">{errors.confidence_level}</p>
            )}
          </div>

          <div>
            <label htmlFor="decision_type" className="block text-sm font-medium text-gray-700 mb-1">
              Reversibility
            </label>
            <select
              id="decision_type"
              value={formData.decision_type || DecisionType.SomewhatReversible}
              onChange={(e) => handleChange('decision_type', e.target.value as DecisionType)}
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FF99C8] bg-white"
            >
              <option value={DecisionType.Reversible}>Reversible</option>
              <option value={DecisionType.SomewhatReversible}>Somewhat Reversible</option>
              <option value={DecisionType.Irreversible}>Irreversible</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Optimized For
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {Object.values(OptimizedFor).map((opt) => (
              <label key={opt} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.optimized_for?.includes(opt) || false}
                  onChange={(e) => {
                    const current = formData.optimized_for || [];
                    if (e.target.checked) {
                      handleChange('optimized_for', [...current, opt]);
                    } else {
                      handleChange(
                        'optimized_for',
                        current.filter((o) => o !== opt)
                      );
                    }
                  }}
                  className="rounded border-gray-300 text-[#FF99C8] focus:ring-[#FF99C8]"
                />
                <span className="text-sm text-gray-700">{OPTIMIZED_FOR_LABELS[opt]}</span>
              </label>
            ))}
          </div>
        </div>
      </section>

      {/* Section 4: Options Considered */}
      <section className="border border-gray-200 rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Options Considered <span className="text-red-500">*</span></h2>
            <p className="text-xs text-gray-500 mt-1">What alternatives did you consider?</p>
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={handleOptionAdd}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Option
          </Button>
        </div>

        {errors.options_considered && (
          <p className="text-xs text-red-600">{errors.options_considered}</p>
        )}

        {formData.options_considered && formData.options_considered.length > 0 ? (
          <div className="space-y-4">
            {formData.options_considered.map((option, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Option {index + 1}</h3>
                  <button
                    type="button"
                    onClick={() => handleOptionRemove(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div>
                  <input
                    type="text"
                    value={option.name}
                    onChange={(e) => handleOptionChange(index, 'name', e.target.value)}
                    placeholder="Option name"
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FF99C8]"
                  />
                </div>

                <div>
                  <textarea
                    value={option.description}
                    onChange={(e) => handleOptionChange(index, 'description', e.target.value)}
                    placeholder="Description"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FF99C8]"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Pros</label>
                    <input
                      type="text"
                      placeholder="Add pro and press Enter"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const value = e.currentTarget.value.trim();
                          if (value) {
                            handleOptionChange(index, 'pros', [...option.pros, value]);
                            e.currentTarget.value = '';
                          }
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FF99C8]"
                    />
                    <ul className="mt-2 space-y-1">
                      {option.pros.map((pro, proIndex) => (
                        <li key={proIndex} className="flex items-center gap-2 text-sm">
                          <span className="text-green-600">•</span>
                          <span className="flex-1">{pro}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const newPros = option.pros.filter((_, i) => i !== proIndex);
                              handleOptionChange(index, 'pros', newPros);
                            }}
                            className="text-gray-400 hover:text-black"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Cons</label>
                    <input
                      type="text"
                      placeholder="Add con and press Enter"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const value = e.currentTarget.value.trim();
                          if (value) {
                            handleOptionChange(index, 'cons', [...option.cons, value]);
                            e.currentTarget.value = '';
                          }
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FF99C8]"
                    />
                    <ul className="mt-2 space-y-1">
                      {option.cons.map((con, conIndex) => (
                        <li key={conIndex} className="flex items-center gap-2 text-sm">
                          <span className="text-red-600">•</span>
                          <span className="flex-1">{con}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const newCons = option.cons.filter((_, i) => i !== conIndex);
                              handleOptionChange(index, 'cons', newCons);
                            }}
                            className="text-gray-400 hover:text-black"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-8">
            No options added yet. Click "Add Option" to start.
          </p>
        )}
      </section>

      {/* Section 5: Tradeoffs */}
      <section className="border border-gray-200 rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Tradeoffs</h2>
          <p className="text-xs text-gray-500">At least one tradeoff required *</p>
        </div>

        {errors.tradeoffs && (
          <p className="text-xs text-red-600">{errors.tradeoffs}</p>
        )}

        <div>
          <label
            htmlFor="tradeoffs_accepted"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Tradeoffs Accepted
          </label>
          <input
            id="tradeoffs_accepted"
            type="text"
            placeholder="Add tradeoff and press Enter"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleArrayAdd('tradeoffs_accepted', e.currentTarget.value);
                e.currentTarget.value = '';
              }
            }}
            className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FF99C8]"
          />
          {formData.tradeoffs_accepted && formData.tradeoffs_accepted.length > 0 && (
            <ul className="mt-2 space-y-1">
              {formData.tradeoffs_accepted.map((tradeoff, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <span className="text-orange-500">▼</span>
                  <span className="flex-1">{tradeoff}</span>
                  <button
                    type="button"
                    onClick={() => handleArrayRemove('tradeoffs_accepted', index)}
                    className="text-gray-400 hover:text-black"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <label
            htmlFor="tradeoffs_rejected"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Tradeoffs Rejected
          </label>
          <input
            id="tradeoffs_rejected"
            type="text"
            placeholder="Add rejected tradeoff and press Enter"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleArrayAdd('tradeoffs_rejected', e.currentTarget.value);
                e.currentTarget.value = '';
              }
            }}
            className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FF99C8]"
          />
          {formData.tradeoffs_rejected && formData.tradeoffs_rejected.length > 0 && (
            <ul className="mt-2 space-y-1">
              {formData.tradeoffs_rejected.map((tradeoff, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <span className="text-red-500">✕</span>
                  <span className="flex-1">{tradeoff}</span>
                  <button
                    type="button"
                    onClick={() => handleArrayRemove('tradeoffs_rejected', index)}
                    className="text-gray-400 hover:text-black"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Section 6: Reflection */}
      <section className="border border-gray-200 rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold">Reflection & Review</h2>

        <div>
          <label htmlFor="assumptions" className="block text-sm font-medium text-gray-700 mb-1">
            Assumptions
          </label>
          <input
            id="assumptions"
            type="text"
            placeholder="Add assumption and press Enter"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleArrayAdd('assumptions', e.currentTarget.value);
                e.currentTarget.value = '';
              }
            }}
            className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FF99C8]"
          />
          {formData.assumptions && formData.assumptions.length > 0 && (
            <ul className="mt-2 space-y-1">
              {formData.assumptions.map((assumption, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <span className="text-gray-400">•</span>
                  <span className="flex-1">{assumption}</span>
                  <button
                    type="button"
                    onClick={() => handleArrayRemove('assumptions', index)}
                    className="text-gray-400 hover:text-black"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <label
            htmlFor="invalidation_conditions"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            When to Revisit (Invalidation Conditions)
          </label>
          <input
            id="invalidation_conditions"
            type="text"
            placeholder="Add condition and press Enter"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleArrayAdd('invalidation_conditions', e.currentTarget.value);
                e.currentTarget.value = '';
              }
            }}
            className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FF99C8]"
          />
          {formData.invalidation_conditions && formData.invalidation_conditions.length > 0 && (
            <ul className="mt-2 space-y-1">
              {formData.invalidation_conditions.map((condition, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <span className="text-orange-500">⚠</span>
                  <span className="flex-1">{condition}</span>
                  <button
                    type="button"
                    onClick={() => handleArrayRemove('invalidation_conditions', index)}
                    className="text-gray-400 hover:text-black"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="next_review_date"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Next Review Date
            </label>
            <input
              id="next_review_date"
              type="date"
              value={formData.next_review_date || ''}
              onChange={(e) => handleChange('next_review_date', e.target.value || null)}
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FF99C8]"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer mt-7">
              <input
                type="checkbox"
                checked={formData.flagged_for_review || false}
                onChange={(e) => handleChange('flagged_for_review', e.target.checked)}
                className="rounded border-gray-300 text-[#FF99C8] focus:ring-[#FF99C8]"
              />
              <span className="text-sm font-medium text-gray-700">Flag for review</span>
            </label>
          </div>
        </div>

        {formData.flagged_for_review && (
          <div>
            <label
              htmlFor="revisit_reason"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Reason for Review
            </label>
            <textarea
              id="revisit_reason"
              value={formData.revisit_reason || ''}
              onChange={(e) => handleChange('revisit_reason', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FF99C8]"
              placeholder="Why should this be reviewed?"
            />
          </div>
        )}

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Additional Notes
          </label>
          <textarea
            id="notes"
            value={formData.notes || ''}
            onChange={(e) => handleChange('notes', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FF99C8]"
            placeholder="Any additional thoughts or context"
          />
        </div>
      </section>

      {/* Submit buttons */}
      <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-200">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting}
          className="flex items-center gap-2 min-w-[120px]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              {mode === 'create' ? 'Create' : 'Save'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
