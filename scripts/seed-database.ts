#!/usr/bin/env ts-node

/**
 * Database Seeding Script for Decision Log
 *
 * Purpose: Programmatically insert sample decisions into Supabase
 * Usage: npx ts-node scripts/seed-database.ts
 *
 * Prerequisites:
 * 1. Install dependencies: npm install @supabase/supabase-js dotenv
 * 2. Install ts-node: npm install -D ts-node
 * 3. Set up .env.local with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// ============================================================================
// CONFIGURATION
// ============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing Supabase environment variables');
  console.error('   Make sure .env.local contains:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================================================
// SAMPLE DECISIONS DATA
// ============================================================================

const sampleDecisions = [
  {
    // Metadata
    title: 'Choose Supabase as database backend for Decision Log',
    project_name: 'Decision Log App',
    category: 'data-storage',
    tags: ['postgres', 'supabase', 'backend', 'database', 'full-text-search'],
    notes: 'First major technical decision for this project. Need to balance learning goals with practical requirements.',

    // Context
    business_context: 'Building a personal decision tracking app to log ~50 decisions per month and analyze patterns over time. Need persistent storage with full-text search, date-based queries, and pattern analysis capabilities. Expected scale: ~600 decisions/year. This is both a learning project (practice prompting AI) and a real tool I\'ll use daily.',
    problem_statement: 'Need to select a database solution that supports full-text search, complex array/JSONB queries, low operational overhead, free tier for personal use, Next.js integration, TypeScript support, and analytical query capabilities.',
    stakeholders: ['Adam (developer and sole user)'],
    decision_type: 'somewhat-reversible',

    // Decision Details
    options_considered: [
      {
        name: 'Supabase (PostgreSQL)',
        description: 'Hosted PostgreSQL with built-in APIs, auth, and real-time subscriptions',
        pros: [
          'Full PostgreSQL feature set (GIN indexes, full-text search, JSONB)',
          'Generous free tier (500MB storage, unlimited API requests)',
          'Excellent Next.js integration',
          'Auto-generated REST and GraphQL APIs',
          'Built-in authentication ready for future multi-user',
          'SQL editor in dashboard for running analytics queries',
          'Strong TypeScript support via generated types',
          'Real-time subscriptions if needed later',
          'Learning opportunity: PostgreSQL patterns'
        ],
        cons: [
          'Vendor lock-in (though data export is easy)',
          'Slight learning curve for Supabase APIs',
          'Free tier has connection limits (not an issue for low traffic)',
          'Requires internet connection to access data'
        ]
      },
      {
        name: 'Firebase Firestore',
        description: 'NoSQL document database with real-time sync',
        pros: [
          'Very easy to get started',
          'Generous free tier',
          'Excellent real-time capabilities',
          'Good Next.js integration',
          'Strong offline support'
        ],
        cons: [
          'NoSQL limitations for complex analytical queries',
          'No full-text search (need Algolia integration)',
          'Query limitations (no array aggregations like UNNEST)',
          'More expensive at scale',
          'Less powerful for pattern analysis queries',
          'Not a transferable skill (Postgres is more universal)'
        ]
      },
      {
        name: 'Local SQLite + Turso',
        description: 'SQLite with edge replication via Turso',
        pros: [
          'Extremely fast local queries',
          'Works offline',
          'Very generous free tier',
          'Simple schema'
        ],
        cons: [
          'Limited full-text search compared to Postgres',
          'No JSONB type (must serialize to TEXT)',
          'Turso is newer/less proven',
          'More complex sync logic',
          'Limited array operations'
        ]
      },
      {
        name: 'PlanetScale (MySQL)',
        description: 'Hosted MySQL with branching',
        pros: [
          'Generous free tier',
          'Database branching for dev/prod',
          'Good performance'
        ],
        cons: [
          'MySQL has weaker full-text search than Postgres',
          'No native JSONB (JSON is less performant)',
          'No array types',
          'Less powerful for analytical queries',
          'Branching not needed for single-user app'
        ]
      }
    ],
    chosen_option: 'Supabase (PostgreSQL)',
    reasoning: 'Chose Supabase for several key reasons: 1) PostgreSQL\'s GIN indexes, full-text search, and array operations are perfect for pattern analysis queries. 2) Built-in auth and RLS make it easy to add multi-user support later. 3) PostgreSQL skills transfer to many professional contexts. 4) SQL editor in dashboard enables quick iteration on analytical queries. 5) Free tier easily handles years of data. The decision came down to Supabase vs Firebase - Firebase would be faster to start, but Postgres\'s query capabilities are essential for pattern analysis.',
    confidence_level: 8,

    // Tradeoff Analysis
    tradeoffs_accepted: [
      'Vendor lock-in to Supabase',
      'Requires internet connection for data access',
      'Slightly steeper learning curve vs NoSQL',
      'Connection pooling complexity if scaling beyond free tier'
    ],
    tradeoffs_rejected: [
      'Firebase\'s simpler API',
      'SQLite\'s offline-first approach',
      'PlanetScale\'s database branching'
    ],
    optimized_for: ['learning', 'flexibility', 'simplicity'],

    // Reflection
    assumptions: [
      'I will actually use this app regularly (not just build and abandon)',
      'Pattern analysis queries are the core value, not just CRUD',
      'Free tier is sufficient for personal use scale',
      'PostgreSQL skills remain relevant for 5+ years',
      'Supabase remains free and available'
    ],
    invalidation_conditions: [
      'App usage drops below 10 decisions/month for 3 consecutive months',
      'Supabase changes pricing model to make free tier unusable',
      'Pattern analysis queries become too slow (>1s) due to data volume',
      'Need offline-first capabilities for mobile app',
      'PostgreSQL complexity becomes barrier to rapid iteration'
    ],
    next_review_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 days from now
    revisit_reason: 'Check if full-text search and pattern queries are performant with real data (~150 decisions by then). Evaluate if Supabase API complexity was worth it.',
    flagged_for_review: false,

    // Outcomes (would be NULL initially, but including example data)
    outcome: null,
    outcome_date: null,
    outcome_success: null,
    lessons_learned: null,

    // Relationships
    similar_decision_ids: [],
    related_decision_ids: [],
    similarity_notes: []
  },
  {
    // Metadata
    title: 'Use Tailwind CSS with shadcn/ui components',
    project_name: 'Decision Log App',
    category: 'tool-selection',
    tags: ['tailwind', 'shadcn', 'ui', 'css', 'components'],
    notes: null,

    // Context
    business_context: 'Need a UI framework that enables rapid development while maintaining design consistency and accessibility.',
    problem_statement: 'Choose CSS framework and component library for building decision log interface.',
    stakeholders: ['Adam'],
    decision_type: 'reversible',

    // Decision Details
    options_considered: [
      {
        name: 'Tailwind CSS + shadcn/ui',
        description: 'Utility-first CSS with pre-built accessible components',
        pros: [
          'Rapid development with utility classes',
          'No component library lock-in (copy/paste components)',
          'Excellent customization',
          'Built on Radix UI (accessible by default)',
          'Great TypeScript support'
        ],
        cons: [
          'Learning curve for Tailwind utilities',
          'More verbose HTML',
          'Need to manage component code yourself'
        ]
      },
      {
        name: 'Material-UI',
        description: 'Comprehensive React component library',
        pros: [
          'Battle-tested',
          'Many pre-built components',
          'Good documentation'
        ],
        cons: [
          'Heavy bundle size',
          'Harder to customize',
          'Distinctive Material Design aesthetic'
        ]
      }
    ],
    chosen_option: 'Tailwind CSS + shadcn/ui',
    reasoning: 'Tailwind provides utility-first styling with excellent developer experience. Shadcn/ui provides pre-built accessible components that can be customized. Together they enable rapid UI development without heavy component library lock-in.',
    confidence_level: 7,

    // Tradeoff Analysis
    tradeoffs_accepted: ['Learning curve for Tailwind utility classes', 'More verbose HTML'],
    tradeoffs_rejected: ['Material-UI\'s heavier bundle size'],
    optimized_for: ['speed', 'flexibility', 'simplicity'],

    // Reflection
    assumptions: [
      'Tailwind skills remain relevant',
      'Accessibility is important',
      'Will need form components and data tables'
    ],
    invalidation_conditions: [
      'Spending >2 hours on basic UI tasks that would be instant with pre-built library',
      'Accessibility issues slip through despite Radix foundation'
    ],
    next_review_date: null,
    revisit_reason: null,
    flagged_for_review: false,

    // Outcomes
    outcome: null,
    outcome_date: null,
    outcome_success: null,
    lessons_learned: null,

    // Relationships
    similar_decision_ids: [],
    related_decision_ids: [],
    similarity_notes: []
  }
];

// ============================================================================
// SEEDING FUNCTIONS
// ============================================================================

async function clearExistingData() {
  console.log('🗑️  Clearing existing sample data...');

  const { error } = await supabase
    .from('decisions')
    .delete()
    .eq('project_name', 'Decision Log App');

  if (error) {
    console.error('❌ Error clearing existing data:', error.message);
    throw error;
  }

  console.log('✅ Existing sample data cleared');
}

async function seedDecisions() {
  console.log('🌱 Seeding sample decisions...');

  for (const [index, decision] of sampleDecisions.entries()) {
    const { data, error } = await supabase
      .from('decisions')
      .insert(decision)
      .select()
      .single();

    if (error) {
      console.error(`❌ Error inserting decision ${index + 1}:`, error.message);
      throw error;
    }

    console.log(`✅ Inserted decision ${index + 1}/${sampleDecisions.length}: "${decision.title}"`);
  }
}

async function verifyData() {
  console.log('\n🔍 Verifying seeded data...');

  const { data, error, count } = await supabase
    .from('decisions')
    .select('*', { count: 'exact' })
    .eq('project_name', 'Decision Log App');

  if (error) {
    console.error('❌ Error verifying data:', error.message);
    throw error;
  }

  console.log(`✅ Found ${count} decisions in database`);

  if (data && data.length > 0) {
    console.log('\n📊 Sample decision:');
    console.log(`   Title: ${data[0].title}`);
    console.log(`   Category: ${data[0].category}`);
    console.log(`   Tags: ${data[0].tags?.join(', ') || 'none'}`);
    console.log(`   Confidence: ${data[0].confidence_level}/10`);
  }
}

async function testFullTextSearch() {
  console.log('\n🔍 Testing full-text search...');

  const { data, error } = await supabase
    .from('decisions')
    .select('title, category')
    .textSearch('search_vector', 'postgres & database');

  if (error) {
    console.error('❌ Error testing full-text search:', error.message);
    throw error;
  }

  console.log(`✅ Full-text search found ${data?.length || 0} results`);
  if (data && data.length > 0) {
    data.forEach((d) => console.log(`   - ${d.title}`));
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  console.log('🚀 Decision Log Database Seeding Script\n');

  try {
    // Test connection
    console.log('📡 Testing database connection...');
    const { error: connectionError } = await supabase.from('decisions').select('count').limit(1);

    if (connectionError) {
      console.error('❌ Failed to connect to database:', connectionError.message);
      console.error('\nTroubleshooting:');
      console.error('1. Check that .env.local exists with correct Supabase credentials');
      console.error('2. Verify Supabase project is active (not paused)');
      console.error('3. Ensure schema.sql has been run in Supabase SQL editor');
      process.exit(1);
    }
    console.log('✅ Database connection successful\n');

    // Clear existing sample data
    await clearExistingData();

    // Seed new data
    await seedDecisions();

    // Verify
    await verifyData();

    // Test full-text search
    await testFullTextSearch();

    console.log('\n🎉 Database seeding completed successfully!\n');
    console.log('Next steps:');
    console.log('1. View data in Supabase dashboard → Table Editor → decisions');
    console.log('2. Run queries from docs/USEFUL_QUERIES.md');
    console.log('3. Start building your decision log UI');

    process.exit(0);
  } catch (error) {
    console.error('\n💥 Seeding failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

// Export for potential reuse
export { sampleDecisions, seedDecisions, clearExistingData };
