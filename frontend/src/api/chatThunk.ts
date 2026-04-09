import { fetchEventSource } from '@microsoft/fetch-event-source';

import {
    addUserMessage,
    appendStreamChunk,
    streamError,
    streamFinished,
    streamStarted,
} from '@/api/chatSlice';
import type { AppDispatch, RootState } from '@/api/store';

export const sendMessage =
    (userInput: string) =>
    async (dispatch: AppDispatch, getState: () => RootState) => {
        dispatch(addUserMessage(userInput));
        dispatch(streamStarted());

        const { messages } = getState().chat;

        await fetchEventSource('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages }),

            onmessage(event) {
                const data = JSON.parse(event.data);

                if (data.content) {
                    dispatch(appendStreamChunk(data.content));
                }

                if (data.done) {
                    dispatch(streamFinished());
                }
            },

            onerror(err) {
                dispatch(streamError('Stream failed'));
                // Stops retrying
                throw err;
            },
        });
    };
