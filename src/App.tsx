import { QueryClient, QueryClientProvider } from 'react-query';
import { GPUDashboard } from './components/GPUDashboard';

import { ErrorBoundary } from './components/ErrorBoundary';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <GPUDashboard />
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;
