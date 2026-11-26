import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { SendHorizontal } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { useGetMessagesQuery, usePostMessageMutation } from '@/api/message';
import { useGetCurrentUserQuery } from '@/api/user';

const ChatPage = () => {
    const { data: currentUser } = useGetCurrentUserQuery();

    const {
        data: messages = [],
        isLoading,
        error,
    // eslint-disable-next-line no-undefined
    } = useGetMessagesQuery(undefined, { pollingInterval: 3000 });
    const [postMessage, { isLoading: isSending }] = usePostMessageMutation();

    const [draft, setDraft] = useState('');
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages.length]);

    const send = async () => {
        const body = draft.trim();
        if (!body) {
            return;
        }

        setDraft('');
        try {
            await postMessage({ body }).unwrap();
        } catch {
            setDraft(body);
        }
    };

    return (
        <div className="flex h-[calc(100vh-12rem)] flex-col space-y-4">
            <div className="px-2">
                <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
                    Chat
                </h1>
                <p className="text-sm text-zinc-500">
                    Felles chat for alle i Mandagsmiddag
                </p>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                {isLoading && (
                    <p className="text-sm text-zinc-500">Henter meldinger...</p>
                )}

                {error && (
                    <p className="text-sm text-red-600">
                        Klarte ikke hente meldinger :(
                    </p>
                )}

                {!isLoading && messages.length === 0 && (
                    <p className="text-sm text-zinc-500">
                        Ingen meldinger enda. Si hei! 👋
                    </p>
                )}

                {messages.map((message) => {
                    const own = message.senderId === currentUser?.id;

                    return (
                        <div
                            key={message.id}
                            className={`flex ${own ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                                    own
                                        ? 'rounded-br-sm bg-zinc-900 text-white'
                                        : 'rounded-bl-sm bg-zinc-100 text-zinc-900'
                                }`}
                            >
                                <p
                                    className={`text-[11px] font-semibold ${
                                        own ? 'text-zinc-400' : 'text-zinc-500'
                                    }`}
                                >
                                    {message.senderName}
                                </p>
                                <p className="whitespace-pre-wrap break-words">
                                    {message.body}
                                </p>
                                <p
                                    className={`mt-1 text-[10px] ${
                                        own ? 'text-zinc-400' : 'text-zinc-400'
                                    }`}
                                >
                                    {format(
                                        new Date(message.createdAt),
                                        'd. MMM HH:mm',
                                        { locale: nb }
                                    )}
                                </p>
                            </div>
                        </div>
                    );
                })}

                <div ref={bottomRef} />
            </div>

            <form
                className="flex items-center gap-2"
                onSubmit={(event) => {
                    event.preventDefault();
                    send().catch(() => {
                        // Errors are handled inside send()
                    });
                }}
            >
                <input
                    type="text"
                    value={draft}
                    onChange={(event) => {
                        setDraft(event.target.value);
                    }}
                    placeholder="Skriv en melding..."
                    className="flex-1 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-zinc-400"
                />
                <button
                    type="submit"
                    disabled={isSending || draft.trim() === ''}
                    className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50"
                >
                    <SendHorizontal size={16} />
                    Send
                </button>
            </form>
        </div>
    );
};

export default ChatPage;
