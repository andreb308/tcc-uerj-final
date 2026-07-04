import { NextResponse } from 'next/server';
import { getPublicReportAction } from '@/app/actions/report';
import { generateText, Output } from 'ai';
import { createOpenRouter, OpenRouterProviderOptions } from '@openrouter/ai-sdk-provider';
import { REPORT_SYSTEM_PROMPT } from '@/lib/prompts';
import { reportDataSchema } from '@/lib/schemas/report';
import { prisma } from '@/lib/prisma';

export const maxDuration = 30; // Set to 30 seconds
// ---------------------------------------------------------------------------
// GET /api/report/[id] — Retrieve a report record
// ---------------------------------------------------------------------------
// Returns the full report record (status, input data, and AI output if available)
// ---------------------------------------------------------------------------

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const openrouter = createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY,
      appName: 'tcc-uerj',
    });

    const { id } = await params;
    console.log(`report/[id]/route.ts -> ID recebido: ${id}`);

    if (!id) {
      return NextResponse.json({ error: 'Missing report ID' }, { status: 400 });
    }

    const report = await getPublicReportAction(id);

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    if (!report?.reportData) {
      await prisma.report.update({
        where: { id },
        data: { status: 'generating' },
      });

      const { text, output, sources, providerMetadata } = await generateText({
        model: openrouter.chat('google/gemini-3.1-flash-lite'),
        prompt: `
        artist: '${report.artist}',
        trackTitle: '${report.trackTitle}',
        targetLanguage: '${report.targetLanguage}',
        artifactData: ${JSON.stringify(report.artifactData)},`,
        tools: {
          //@ts-expect-error
          web_search: openrouter.tools.webSearch({ needsApproval: false }),
        },
        system: REPORT_SYSTEM_PROMPT,
        output: Output.object({ schema: reportDataSchema }),
        providerOptions: {
          reasoning: {
            enabled: true,
            effort: 'medium',
          },
        } satisfies OpenRouterProviderOptions,
      });

      console.log(JSON.stringify({ text, sources }));

      // Save the generated data and update status
      await prisma.report.update({
        where: { id },
        data: {
          reportData: output as any,
          status: 'complete',
        },
      });

      // Return the updated report record
      const updatedReport = await getPublicReportAction(id);
      return NextResponse.json(updatedReport);
    }

    return NextResponse.json(report);
  } catch (error: any) {
    console.error('Error fetching report:', JSON.stringify(error));
    return NextResponse.json({ error: 'Internal server error', ...error }, { status: 500 });
  }
}
