// PATH: /src/app/api/assessments/[trade]/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export async function GET(request, { params }) {
  const { trade } = await params; 

  const VALID = ['Carpenter', 'Electrician', 'Kasambahay'];
  if (!VALID.includes(trade)) {
    return NextResponse.json({ status: 'error', message: 'Invalid trade' }, { status: 400 });
  }

  const supabase = serviceClient();

  const { data: test, error } = await supabase
    .from('assessment_tests')
    .select(`
      test_id,
      trade_category,
      test_title,
      passing_score,
      assessment_questions (
        question_id,
        question_text,
        question_order,
        points,
        assessment_choices (
          choice_id,
          choice_text,
          choice_order
        )
      )
    `)
    .eq('trade_category', trade)
    .eq('is_active', true)
    .single();

  if (error || !test) {
    return NextResponse.json({ status: 'error', message: 'No active test found for this trade.' }, { status: 404 });
  }

  // Sort components sequentially by order flags and ensure answers are completely hidden
  const sanitised = {
    ...test,
    assessment_questions: (test.assessment_questions ?? [])
      .sort((a, b) => a.question_order - b.question_order)
      .map((q) => ({
        ...q,
        assessment_choices: (q.assessment_choices ?? [])
          .sort((a, b) => a.choice_order - b.choice_order),
      })),
  };

  return NextResponse.json({ status: 'success', data: sanitised });
}