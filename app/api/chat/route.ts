import { streamText, UIMessage, convertToModelMessages } from 'ai';
import { createOpenRouter, OpenRouterProviderOptions } from '@openrouter/ai-sdk-provider';
import { getReportAction } from '@/app/actions/report';
import { CHAT_SYSTEM_PROMPT } from '@/lib/prompts';

export const maxDuration = 30;

// ---------------------------------------------------------------------------
// POST /api/chat — Conversational AI (optionally seeded with report context)
// ---------------------------------------------------------------------------
// When `reportId` is provided in the request body, the completed report data
// is injected into the system prompt so the LLM can reference the analysis.
// ---------------------------------------------------------------------------

export async function POST(req: Request) {
  try {
    const openrouter = createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY,
      appName: 'tcc-uerj',
    });

    const { messages, reportId }: { messages: UIMessage[]; reportId?: string } = await req.json();

    // Build the system prompt — optionally enriched with report context
    let systemPrompt = CHAT_SYSTEM_PROMPT;

    if (reportId) {
      const record = await getReportAction(reportId);

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
      model: openrouter.chat('google/gemini-3.1-flash-lite'),
      messages: await convertToModelMessages(messages || []),
      tools: {
        //@ts-expect-error
        web_search: openrouter.tools.webSearch({ needsApproval: false }),
      },
      system: systemPrompt,
      providerOptions: {
        reasoning: {
          enabled: true,
          effort: 'medium',
        },
      } satisfies OpenRouterProviderOptions,
    });

    return result.toUIMessageStreamResponse({ sendReasoning: true });
  } catch (error: any) {
    console.error('Error in chat route:', JSON.stringify(error));
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
