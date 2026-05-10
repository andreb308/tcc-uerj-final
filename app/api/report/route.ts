import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createReport } from '@/lib/report-store';

// ---------------------------------------------------------------------------
// POST /api/report — Create a new report record
// ---------------------------------------------------------------------------
// Receives validated form data, creates a pending record in the store,
// and returns the generated { id }. No AI call happens here.
// ---------------------------------------------------------------------------

const createReportSchema = z.object({
  artist: z.string().min(1),
  trackTitle: z.string().min(1),
  targetLanguage: z.string().min(1),
  artifactData: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = createReportSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: z.treeifyError(parsed.error).errors },
        { status: 400 }
      );
    }

    // Equivalent to prisma.create for the empty 'pending' report.
    const { id } = createReport(parsed.data);

    return NextResponse.json({ id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
