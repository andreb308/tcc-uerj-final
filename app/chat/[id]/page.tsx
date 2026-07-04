'use client';

import { useParams } from 'next/navigation';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useChat } from '@ai-sdk/react';
import type { UIMessage } from 'ai';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';

import type { ReportRecord } from '@/lib/schemas/report';
import { saveChatHistoryAction, getChatSessionAction } from '@/app/actions/report';

import { EvidencePane } from '@/components/chat/evidence-pane';
import { InterrogationPane } from '@/components/chat/interrogation-pane';

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const { isLoaded, userId: clientUserId } = useAuth();
  const [activeLine, setActiveLine] = useState<number | null>(null);
  const [sessionStartTime] = useState(() =>
    new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'UTC',
    })
  );

  // Fetch report data (secure chat session)
  const { data: report } = useSuspenseQuery<ReportRecord>({
    queryKey: ['report', id],
    queryFn: async () => {
      // If client auth is loaded and we have no user, throw instant error
      if (isLoaded && !clientUserId) {
        throw new Error(
          'Unauthorized: This record does not belong to your active session credentials or the record is missing.'
        );
      }

      const data = await getChatSessionAction(id);
      if (!data) {
        throw new Error('Report not found');
      }
      return data;
    },
    refetchOnWindowFocus: false,
  });

  if (!report || !report.reportData) {
    throw new Error('Report analysis data is incomplete or missing.');
  }

  // Parse initial messages from chat history
  const initialMessages: UIMessage[] =
    report.chatHistory && Array.isArray(report.chatHistory) && report.chatHistory.length > 0
      ? (report.chatHistory as UIMessage[])
      : [
          {
            id: 'msg-init-01',
            role: 'assistant',
            parts: [
              {
                type: 'text',
                text: 'WELCOME TO THE DECONSTRUCTION SESSION.\n\nI HAVE MOUNTED THE ARTIFACT IN THE EVIDENCE PANE ON THE LEFT. CLICK ON ANY LYRIC LINE TO BIND IT AS EVIDENCE, OR ENTER YOUR OWN DIRECT INTERROGATION BELOW TO COMMENCE SEMANTIC ANATOMIZATION.',
                state: 'done',
              },
            ],
          },
        ];

  const [input, setInput] = useState('');

  const { messages, status, sendMessage } = useChat({
    id: `chat-${id}`,
    messages: initialMessages,
    onFinish: () => handleNewMessage(),
  });

  const handleNewMessage = () => {
    saveChatHistoryAction(id, messages);
  };

  const handleSubmit = (e?: React.SubmitEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;
    sendMessage({ text: input }, { body: { reportId: id } });
    setInput('');
  };

  // Auto-save on beforeunload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (messages.length > 0) {
        saveChatHistoryAction(id, messages);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [id, messages]);

  // Handle line click: set active + insert into input
  const handleLineClick = useCallback(
    (lineIndex: number, lineText: string) => {
      setActiveLine(lineIndex);
      const reference = `'${lineText}"'`;
      setInput((prev) => prev + ' ' + lineText);

      // Auto-focus the textarea
      setTimeout(() => {
        const textarea = document.querySelector('textarea');
        if (textarea) {
          textarea.focus();
          // textarea.setSelectionRange(lineText.length, lineText.length);
        }
      }, 0);
    },
    [setInput]
  );

  return (
    <div className="flex grow overflow-hidden">
      <EvidencePane report={report} activeLine={activeLine} onLineClick={handleLineClick} />
      <InterrogationPane
        messages={messages}
        input={input}
        setInput={setInput}
        handleSubmit={handleSubmit}
        status={status}
        sessionStartTime={sessionStartTime}
      />
    </div>
  );
}
