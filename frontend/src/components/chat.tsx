import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { sendMessage } from '@/api/chatThunk';
import type { AppDispatch, RootState } from '@/api/store';

const inputClassName =
    'w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-200';

const Chat = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { messages, streamingContent, isStreaming, error } = useSelector(
        (state: RootState) => state.chat
    );
    const [input, setInput] = useState('');
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, streamingContent]);

    const handleSend = async () => {
        if (!input.trim() || isStreaming) {
            return;
        }
        await dispatch(sendMessage(input.trim()));
        setInput('');
    };

    return (
        <div className="w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white shadow-sm flex flex-col h-[600px]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-zinc-200">
                <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
                    AI
                </h2>
                <p className="mt-1 text-sm leading-6 text-zinc-600">
                    {isStreaming ? 'Tenker...' : 'Spør meg!'}
                </p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                {messages.length === 0 && !isStreaming && (
                    <p className="text-sm text-zinc-400 text-center mt-8">
                        Ingen meldinger enda
                    </p>
                )}

                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[75%] rounded-xl px-3 py-2.5 text-sm leading-relaxed ${
                                msg.role === 'user'
                                    ? 'bg-zinc-900 text-white'
                                    : 'bg-zinc-50 border border-zinc-200 text-zinc-900'
                            }`}
                        >
                            {msg.content}
                        </div>
                    </div>
                ))}

                {isStreaming && (
                    <div className="flex justify-start">
                        <div className="max-w-[75%] rounded-xl px-3 py-2.5 text-sm leading-relaxed bg-zinc-50 border border-zinc-200 text-zinc-900">
                            {streamingContent || (
                                <span className="flex gap-1 items-center h-4">
                                    <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:0ms]" />
                                    <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:150ms]" />
                                    <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:300ms]" />
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {error && (
                    <p className="text-sm text-red-500 text-center">{error}</p>
                )}

                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-6 py-4 border-t border-zinc-200 flex gap-3">
                <input
                    value={input}
                    onChange={(event) => {
                        setInput(event.target.value);
                    }}
                    onKeyDown={(event) => event.key === 'Enter' && handleSend()}
                    disabled={isStreaming}
                    placeholder="Say something..."
                    className={inputClassName}
                />
                <button
                    onClick={handleSend}
                    disabled={isStreaming || !input.trim()}
                    className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    Send
                </button>
            </div>
        </div>
    );
};

export default Chat;
