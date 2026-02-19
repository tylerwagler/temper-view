import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAvailableModels } from '../api/modelApi';
import { Layers, Loader2, CheckCircle2 } from 'lucide-react';

interface ModelSelectorProps {
  isAdmin: boolean;
  session?: any;
}

export const ModelSelector: React.FC<ModelSelectorProps> = () => {
  const { data: availableModels, isLoading } = useQuery({
    queryKey: ['available-models'],
    queryFn: getAvailableModels,
    refetchInterval: 5000
  });

  const readyModels = availableModels?.filter(m => m.status === 'ready') || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'bg-green-400';
      case 'loading': return 'bg-yellow-400 animate-pulse';
      default: return 'bg-red-400';
    }
  };

  return (
    <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6 shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <Layers className="w-5 h-5 text-accent-cyan" />
        <h3 className="text-lg font-bold">Active Models</h3>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-dark-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading...</span>
        </div>
      ) : readyModels.length > 0 ? (
        <div className="space-y-2">
          {readyModels.map(model => (
            <div key={model.name} className="flex items-center gap-3 px-4 py-2 bg-dark-800 rounded-lg border border-dark-700">
              <div className={`w-2 h-2 rounded-full ${getStatusColor(model.status)}`} />
              <div className="flex-1">
                <p className="font-medium text-white">{model.alias}</p>
                <p className="text-xs text-dark-400">
                  {model.ctx_size.toLocaleString()} ctx &bull; {model.backend} &bull; {model.host}
                </p>
              </div>
              <CheckCircle2 className="w-4 h-4 text-green-400" />
            </div>
          ))}
          <p className="text-xs text-dark-500 mt-2">
            Manage models from the Models tab
          </p>
        </div>
      ) : (
        <div className="text-dark-400 text-sm">No models loaded. Load a model from the Models tab.</div>
      )}
    </div>
  );
};
