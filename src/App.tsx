import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GPUDashboard } from './components/GPUDashboard';
import { SettingsPage } from './components/SettingsPage';
import { ErrorBoundary } from './components/ErrorBoundary';

const queryClient = new QueryClient();

function App() {
  const [view, setView] = useState<'dashboard' | 'settings'>('dashboard');

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        {view === 'dashboard' ? (
          <GPUDashboard onOpenSettings={() => setView('settings')} />
        ) : (
          <SettingsPage onBack={() => setView('dashboard')} />
        )}
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;
