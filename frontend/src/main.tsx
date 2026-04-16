import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MantineProvider, localStorageColorSchemeManager } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import './styles/global.css';

import { theme } from './theme/theme';
import App from './App.tsx';

const colorSchemeManager = localStorageColorSchemeManager({ key: 'offertrail.color-scheme' });

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30 * 1000,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <MantineProvider theme={theme} defaultColorScheme="auto" colorSchemeManager={colorSchemeManager}>
        <Notifications position="bottom-right" />
        <App />
      </MantineProvider>
    </QueryClientProvider>
  </StrictMode>,
);
