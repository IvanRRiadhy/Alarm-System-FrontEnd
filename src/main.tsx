// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import React, { Suspense } from 'react';
import { Provider } from 'react-redux';
import ReactDOM from 'react-dom/client';
import App from './App';
import { store } from './store/Store';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Spinner from './views/spinner/Spinner';
import './utils/i18n';
import './_mockApis';
import { loadRuntimeConfig } from './config';
import { initializeAxiosBaseURL } from './utils/axios';

// ✅ Buat QueryClient instance global
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, 
      retry: 2, 
      staleTime: 5_000, 
      gcTime: 5 * 60_000, 
    },
  },
});

async function startApp() {
  await loadRuntimeConfig();
  initializeAxiosBaseURL();

  ReactDOM.createRoot(document.getElementById('root')!).render(
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={<Spinner />}>
        <App />
      </Suspense>
    </QueryClientProvider>
  </Provider>,
)
}

startApp();


