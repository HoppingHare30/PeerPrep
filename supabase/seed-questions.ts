import { createClient } from '@supabase/supabase-js';
import Papa from 'papaparse';
import * as fs from 'fs';
import * as path from 'path';

// Seed variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('⚠️ Environment variables missing. Skipping question cache seeding.');
  process.exit(0);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const TOP_10_COMPANIES = [
  { name: 'Google', slug: 'Google' },
  { name: 'Amazon', slug: 'Amazon' },
  { name: 'Microsoft', slug: 'Microsoft' },
  { name: 'Meta', slug: 'Facebook' },
  { name: 'Netflix', slug: 'Netflix' },
  { name: 'Apple', slug: 'Apple' },
  { name: 'Uber', slug: 'Uber' },
  { name: 'Airbnb', slug: 'Airbnb' },
  { name: 'Twitter / X', slug: 'Twitter' },
  { name: 'LinkedIn', slug: 'LinkedIn' },
];

async function seedQuestionCache() {
  console.log('🚀 Starting seed of question cache for top 10 companies...');

  for (const company of TOP_10_COMPANIES) {
    try {
      console.log(`📡 Fetching CSV data for ${company.name}...`);
      // URL pattern from snehasishroy/leetcode-companywise-interview-questions
      const url = `https://raw.githubusercontent.com/snehasishroy/leetcode-companywise-interview-questions/master/${company.slug.toLowerCase()}/all.csv`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }

      const csvData = await response.text();

      // Parse CSV
      const parsed = Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true,
      });

      if (!parsed.data || parsed.data.length === 0) {
        console.warn(`⚠️ No questions found in CSV for ${company.name}.`);
        continue;
      }

      // Format parsed data
      const questions = parsed.data.map((row: any, index: number) => {
        const urlStr = row.URL || row.url || '';
        const extractedSlug = urlStr.split('/').filter(Boolean).pop() || '';
        return {
          id: row.ID || row.id || String(index + 1),
          title: row.Question || row.Title || row.title || 'Unknown Question',
          titleSlug: extractedSlug || row.TitleSlug || row.titleSlug || '',
          difficulty: row.Difficulty || row.difficulty || 'Medium',
          frequency: parseFloat(String(row['Frequency %'] || row.Frequency || row.frequency || '0').replace('%', '')) || 0,
        };
      });

      // Cache limit to top 50 questions per company for memory optimization
      const topQuestions = questions
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 50);

      // Predefined local fallback hints to seed the cache immediately (AS-003 fallback mechanism)
      const fallbackHints = topQuestions.slice(0, 5).map((q) => ({
        id: q.id,
        title: q.title,
        bruteForce: 'Brute-force simulation of the constraints. Typically O(N^2) or O(2^N) traversal.',
        optimal: 'Optimal optimization utilizing hash maps, two pointers, or sliding window strategies.',
        timeComplexity: 'O(N)',
        spaceComplexity: 'O(1) auxiliary space.',
      }));

      console.log(`💾 Upserting ${topQuestions.length} questions into question_cache for ${company.name}...`);
      
      const { error } = await supabase
        .from('question_cache')
        .upsert({
          company_slug: company.slug,
          questions_json: topQuestions,
          fallback_hints_json: fallbackHints,
          last_refreshed_at: new Date().toISOString(),
        }, {
          onConflict: 'company_slug',
        });

      if (error) {
        throw error;
      }

      console.log(`✅ Successfully seeded question cache for ${company.name}.`);
    } catch (error: any) {
      console.error(`❌ Error seeding cache for ${company.name}:`, error.message);
    }
  }

  console.log('🎉 Question cache seed process complete.');
}

seedQuestionCache();
