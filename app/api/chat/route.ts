import { streamText, UIMessage, convertToModelMessages } from 'ai';
import { google } from '@ai-sdk/google';
import { getReport } from '@/lib/report-store';
import { REPORT_SYSTEM_PROMPT } from '@/lib/prompts';

export const maxDuration = 30;

// ---------------------------------------------------------------------------
// POST /api/chat — Conversational AI (optionally seeded with report context)
// ---------------------------------------------------------------------------
// When `reportId` is provided in the request body, the completed report data
// is injected into the system prompt so the LLM can reference the analysis.
// ---------------------------------------------------------------------------

export async function POST(req: Request) {
  const {
    messages,
    reportId,
  }: { messages: UIMessage[]; reportId?: string } = await req.json();

  // Build the system prompt — optionally enriched with report context
  let systemPrompt = REPORT_SYSTEM_PROMPT;

  if (reportId) {
    const record = getReport(reportId);

    if (record?.reportData) {
      systemPrompt = [
        systemPrompt,
        '',
        '--- CONTEXTO DO RELATÓRIO GERADO ---',
        `Artista: ${record.artist}`,
        `Faixa: ${record.trackTitle}`,
        '',
        'O seguinte é o relatório de análise já gerado para referência:',
        JSON.stringify(record.reportData, null, 2),
        '--- FIM DO CONTEXTO ---',
        '',
        'Use o relatório acima como base para responder às perguntas do usuário.',
        'Responda de forma conversacional, mas mantenha a precisão técnica.',
      ].join('\n');
    }
  }

  const result = streamText({
    model: google('gemma-4-31b-it'),
    messages: await convertToModelMessages(messages || []),
    tools: {
      google_search: google.tools.googleSearch({}),
    },
    system: systemPrompt,
  });

  return result.toUIMessageStreamResponse({ sendReasoning: true });
}
