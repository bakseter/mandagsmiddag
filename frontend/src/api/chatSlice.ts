import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { type Message } from '@/api/chat';

interface ChatState {
    messages: Message[];
    streamingContent: string;
    isStreaming: boolean;
    error: string | null;
}

const initialState: ChatState = {
    messages: [],
    streamingContent: '',
    isStreaming: false,
    error: null,
};

const chatSlice = createSlice({
    name: 'chat',
    initialState,
    reducers: {
        addUserMessage(state, action: PayloadAction<string>) {
            state.messages.push({ role: 'user', content: action.payload });
        },
        appendStreamChunk(state, action: PayloadAction<string>) {
            state.streamingContent += action.payload;
        },
        streamStarted(state) {
            state.isStreaming = true;
            state.streamingContent = '';
            state.error = null;
        },
        streamFinished(state) {
            // Commit the streamed content as a real message
            if (state.streamingContent) {
                state.messages.push({
                    role: 'assistant',
                    content: state.streamingContent,
                });
            }
            state.streamingContent = '';
            state.isStreaming = false;
        },
        streamError(state, action: PayloadAction<string>) {
            state.error = action.payload;
            state.isStreaming = false;
            state.streamingContent = '';
        },
    },
});

export const {
    addUserMessage,
    appendStreamChunk,
    streamStarted,
    streamFinished,
    streamError,
} = chatSlice.actions;

export default chatSlice.reducer;
