// ============================================================================
// SUPABASE QUERIES
// ============================================================================
// Purpose: Database query functions for search and metadata
// Usage: Call from API routes and services
// Note: These functions need to be updated to accept a Supabase client parameter
//       For now, they use the old client pattern (will be refactored)
// ============================================================================

import { createClient } from './client';
import { DecisionCategory } from '@/lib/types/decisions';
import { SearchMetadata } from '@/lib/types/search';

// Create a client instance for these utility functions
// TODO: Refactor these to accept client as parameter
const supabase = createClient();

// ============================================================================
// METADATA QUERIES
// ============================================================================

/**
 * Get distinct categories that exist in the database
 * Used to populate category filter dropdown
 */
export async function getDistinctCategories(): Promise<DecisionCategory[]> {
  try {
    const { data, error } = await supabase
      .from('decisions')
      .select('category')
      .order('category');

    if (error) {
      console.error('Error fetching distinct categories:', error);
      throw new Error(`Failed to fetch categories: ${error.message}`);
    }

    // Get unique categories
    const categories = [...new Set(data.map((d) => d.category))];

    return categories as DecisionCategory[];
  } catch (error) {
    console.error('Error in getDistinctCategories:', error);
    throw error;
  }
}

/**
 * Get distinct project names that exist in the database
 * Used to populate project filter dropdown
 */
export async function getDistinctProjects(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('decisions')
      .select('project_name')
      .not('project_name', 'is', null)
      .order('project_name');

    if (error) {
      console.error('Error fetching distinct projects:', error);
      throw new Error(`Failed to fetch projects: ${error.message}`);
    }

    // Get unique project names
    const projects = [...new Set(data.map((d) => d.project_name).filter(Boolean))];

    return projects as string[];
  } catch (error) {
    console.error('Error in getDistinctProjects:', error);
    throw error;
  }
}

/**
 * Get distinct tags that exist in the database
 * Used to populate tag filter dropdown
 * Note: Flattens tag arrays from all decisions
 */
export async function getDistinctTags(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('decisions')
      .select('tags')
      .not('tags', 'is', null);

    if (error) {
      console.error('Error fetching distinct tags:', error);
      throw new Error(`Failed to fetch tags: ${error.message}`);
    }

    // Flatten all tag arrays and get unique values
    const allTags = data.flatMap((d) => d.tags || []);
    const uniqueTags = [...new Set(allTags)].sort();

    return uniqueTags;
  } catch (error) {
    console.error('Error in getDistinctTags:', error);
    throw error;
  }
}

/**
 * Get confidence range (min/max) from all decisions
 * Used for confidence range slider
 */
export async function getConfidenceRange(): Promise<{ min: number; max: number } | null> {
  try {
    const { data, error } = await supabase
      .from('decisions')
      .select('confidence_level')
      .not('confidence_level', 'is', null)
      .order('confidence_level', { ascending: true });

    if (error) {
      console.error('Error fetching confidence range:', error);
      throw new Error(`Failed to fetch confidence range: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return null;
    }

    const levels = data.map((d) => d.confidence_level).filter((l) => l !== null);

    if (levels.length === 0) {
      return null;
    }

    return {
      min: Math.min(...levels),
      max: Math.max(...levels),
    };
  } catch (error) {
    console.error('Error in getConfidenceRange:', error);
    throw error;
  }
}

/**
 * Get outcome statistics
 * Used for outcome filter display
 */
export async function getOutcomeStats(): Promise<{
  total: number;
  pending: number;
  success: number;
  failed: number;
}> {
  try {
    const { data, error } = await supabase
      .from('decisions')
      .select('outcome_success');

    if (error) {
      console.error('Error fetching outcome stats:', error);
      throw new Error(`Failed to fetch outcome stats: ${error.message}`);
    }

    const total = data.length;
    const pending = data.filter((d) => d.outcome_success === null).length;
    const success = data.filter((d) => d.outcome_success === true).length;
    const failed = data.filter((d) => d.outcome_success === false).length;

    return { total, pending, success, failed };
  } catch (error) {
    console.error('Error in getOutcomeStats:', error);
    throw error;
  }
}

/**
 * Get all search metadata at once
 * More efficient than calling each function separately
 */
export async function getSearchMetadata(): Promise<SearchMetadata> {
  try {
    // Fetch all data in parallel
    const [categories, projects, tags, confidenceRange, outcomeStats] = await Promise.all([
      getDistinctCategories(),
      getDistinctProjects(),
      getDistinctTags(),
      getConfidenceRange(),
      getOutcomeStats(),
    ]);

    return {
      availableCategories: categories,
      availableProjects: projects,
      availableTags: tags,
      confidenceRange: confidenceRange || undefined,
      outcomeStats,
    };
  } catch (error) {
    console.error('Error in getSearchMetadata:', error);
    throw error;
  }
}

// ============================================================================
// SEARCH HELPERS
// ============================================================================

/**
 * Check if full-text search indexes exist
 * Useful for debugging search performance
 */
export async function checkSearchIndexes(): Promise<boolean> {
  try {
    // Try a simple full-text search to see if indexes work
    const { error } = await supabase
      .from('decisions')
      .select('id')
      .textSearch('search_vector', 'test')
      .limit(1);

    return !error;
  } catch (error) {
    console.error('Search indexes check failed:', error);
    return false;
  }
}

/**
 * Get total decision count
 * Used for pagination calculations
 */
export async function getTotalDecisionCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('decisions')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Error fetching decision count:', error);
      throw new Error(`Failed to fetch decision count: ${error.message}`);
    }

    return count || 0;
  } catch (error) {
    console.error('Error in getTotalDecisionCount:', error);
    throw error;
  }
}
