import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Portal } from './components/portal/Portal';
import { ErrorBoundary } from './components/ErrorBoundary';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <Portal />
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;
