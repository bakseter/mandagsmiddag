import '@/index.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';

import App from '@/app.tsx';
import { store } from '@/utils/store.ts';

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
createRoot(document.querySelector('#root')!).render(
    <Provider store={store}>
        <StrictMode>
            <App />
        </StrictMode>
    </Provider>
);
