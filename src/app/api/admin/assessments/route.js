// PATH: /src/app/api/admin/assessments/route.js
// GET  → fetch all tests with question+choice counts per trade
// POST → create a new test with questions and choices in one transaction

import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createClient }       from '@supabase/supabase-js';

// Service role client for data operations — mirrors route.js dual-client pattern
function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

// ── Auth guard (shared) ───────────────────────────────────────────────────
async function guardAdmin() {
  const supabase = createServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  const { data: publicUser } = await supabase
    .from('users')
    .select('role')
    .eq('auth_id', user.id)
    .single();

  return publicUser?.role === 'Admin' ? user : null;
}

// ── GET: list all tests with full question+choice data ────────────────────
export async function GET() {
  const authed = await guardAdmin();
  if (!authed) {
    return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 401 });
  }

  const supabase = adminClient();

  const { data: tests, error } = await supabase
    .from('assessment_tests')
    .select(`
      test_id,
      trade_category,
      test_title,
      passing_score,
      is_active,
      created_at,
      assessment_questions (
        question_id,
        question_text,
        question_order,
        points,
        assessment_choices (
          choice_id,
          choice_text,
          is_correct,
          choice_order
        )
      )
    `)
    .order('test_id', { ascending: true });

  if (error) {
    console.error('[Assessments GET]', error.message);
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }

  // Sort questions and choices by their order fields
  const sorted = tests.map((t) => ({
    ...t,
    assessment_questions: (t.assessment_questions ?? [])
      .sort((a, b) => a.question_order - b.question_order)
      .map((q) => ({
        ...q,
        assessment_choices: (q.assessment_choices ?? [])
          .sort((a, b) => a.choice_order - b.choice_order),
      })),
  }));

  return NextResponse.json({ status: 'success', data: sorted });
}

// ── POST: create a brand-new test with all questions and choices ───────────
// Body shape:
// {
//   trade_category: 'Carpenter' | 'Electrician' | 'Kasambahay',
//   test_title: string,
//   passing_score: number,
//   questions: [
//     {
//       question_text: string,
//       points: number,
//       choices: [{ choice_text: string, is_correct: boolean }]
//     }
//   ]
// }
export async function POST(request) {
  const authed = await guardAdmin();
  if (!authed) {
    return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { trade_category, test_title, passing_score, questions } = body;

  // ── Validate ──────────────────────────────────────────────────────────
  const VALID_TRADES = ['Carpenter', 'Electrician', 'Kasambahay'];
  if (!VALID_TRADES.includes(trade_category))
    return NextResponse.json({ status: 'error', message: 'Invalid trade_category' }, { status: 400 });
  if (!test_title?.trim())
    return NextResponse.json({ status: 'error', message: 'test_title is required' }, { status: 400 });
  if (!questions?.length)
    return NextResponse.json({ status: 'error', message: 'At least one question is required' }, { status: 400 });

  // Every question must have at least one correct choice
  for (const [i, q] of questions.entries()) {
    if (!q.question_text?.trim())
      return NextResponse.json({ status: 'error', message: `Question ${i + 1}: question_text is required` }, { status: 400 });
    if (!q.choices?.length)
      return NextResponse.json({ status: 'error', message: `Question ${i + 1}: choices are required` }, { status: 400 });
    if (!q.choices.some((c) => c.is_correct))
      return NextResponse.json({ status: 'error', message: `Question ${i + 1}: mark at least one correct answer` }, { status: 400 });
  }

  const supabase = adminClient();

  // ── Resolve admin_id from the authed user ─────────────────────────────
  const { data: publicUser } = await supabase
    .from('users')
    .select('user_id')
    .eq('auth_id', authed.id)
    .single();

  const { data: adminRow } = await supabase
    .from('admins')
    .select('admin_id')
    .eq('user_id', publicUser.user_id)
    .single();

  if (!adminRow) {
    return NextResponse.json({ status: 'error', message: 'Admin record not found' }, { status: 403 });
  }

  // ── Deactivate existing active test for this trade (one active per trade) ─
  await supabase
    .from('assessment_tests')
    .update({ is_active: false })
    .eq('trade_category', trade_category)
    .eq('is_active', true);

  // ── Insert test ───────────────────────────────────────────────────────
  const { data: newTest, error: testError } = await supabase
    .from('assessment_tests')
    .insert({
      admin_id:       adminRow.admin_id,
      trade_category,
      test_title:     test_title.trim(),
      passing_score:  passing_score ?? 75.00,
      is_active:      true,
    })
    .select('test_id')
    .single();

  if (testError) {
    console.error('[Assessments POST] test insert:', testError.message);
    return NextResponse.json({ status: 'error', message: testError.message }, { status: 500 });
  }

  // ── Insert questions + choices sequentially ───────────────────────────
  for (const [qIdx, q] of questions.entries()) {
    const { data: newQ, error: qError } = await supabase
      .from('assessment_questions')
      .insert({
        test_id:        newTest.test_id,
        question_text:  q.question_text.trim(),
        question_order: qIdx + 1,
        points:         q.points ?? 1,
      })
      .select('question_id')
      .single();

    if (qError) {
      console.error('[Assessments POST] question insert:', qError.message);
      return NextResponse.json({ status: 'error', message: qError.message }, { status: 500 });
    }

    const choiceRows = q.choices.map((c, cIdx) => ({
      question_id:  newQ.question_id,
      choice_text:  c.choice_text.trim(),
      is_correct:   !!c.is_correct,
      choice_order: cIdx + 1,
    }));

    const { error: cError } = await supabase
      .from('assessment_choices')
      .insert(choiceRows);

    if (cError) {
      console.error('[Assessments POST] choices insert:', cError.message);
      return NextResponse.json({ status: 'error', message: cError.message }, { status: 500 });
    }
  }

  return NextResponse.json({
    status:  'success',
    message: 'Test created successfully.',
    test_id: newTest.test_id,
  });
}