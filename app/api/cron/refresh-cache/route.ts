import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Papa from 'papaparse';

// Direct Admin Client for server cron bypass of standard client RLS limits
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

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

export async function GET(request: Request) {
  try {
    // 1. Verify Vercel Cron Secret (Security check)
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    const authHeader = request.headers.get('authorization');
    const expectedSecret = process.env.CRON_SECRET;

    const isAuthorized =
      secret === expectedSecret ||
      authHeader === `Bearer ${expectedSecret}` ||
      process.env.NODE_ENV === 'development'; // Allow local dev testing without secret

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized: Invalid cron token' }, { status: 401 });
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Supabase credentials missing on server' }, { status: 500 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    console.log('[Cron] Starting scheduled refresh of question cache for target companies...');

    const summary: Record<string, any> = {};

    for (const company of TOP_10_COMPANIES) {
      try {
        const url = `https://raw.githubusercontent.com/snehasishroy/leetcode-companywise-interview-questions/master/data/${company.slug}_alltime.csv`;
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Git raw fetch returned status: ${response.status}`);
        }

        const csvData = await response.text();
        const parsed = Papa.parse(csvData, {
          header: true,
          skipEmptyLines: true,
        });

        if (!parsed.data || parsed.data.length === 0) {
          summary[company.slug] = 'No rows found in parsed CSV';
          continue;
        }

        const questions = parsed.data.map((row: any, index: number) => ({
          id: row.ID || row.id || String(index + 1),
          title: row.Question || row.Title || row.title || 'Unknown Question',
          titleSlug: row.TitleSlug || row.titleSlug || '',
          difficulty: row.Difficulty || row.difficulty || 'Medium',
          frequency: parseFloat(row.Frequency || row.frequency || '0') || 0,
        }));

        // Limit to top 50 frequency questions
        const topQuestions = questions
          .sort((a, b) => b.frequency - a.frequency)
          .slice(0, 50);

        // Map top 5 fallback hints
        const fallbackHints = topQuestions.slice(0, 5).map((q) => ({
          questionId: q.id,
          title: q.title,
          bruteForce: 'Brute-force constraint checking. Nest loops or simulate basic cases.',
          optimal: 'Optimize space and time using hash maps, sliding windows, or sorting helpers.',
          timeComplexity: 'O(N)',
          spaceComplexity: 'O(1) auxiliary.',
        }));

        // Upsert into question_cache table
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

        if (error) throw error;
        summary[company.slug] = `Successfully cached ${topQuestions.length} questions`;
      } catch (err: any) {
        console.error(`Failed to refresh question cache for ${company.slug}:`, err.message);
        summary[company.slug] = `Failed: ${err.message}`;
      }
    }

    return NextResponse.json({ success: true, summary });
  } catch (err: any) {
    console.error('Question cache refresh API error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
