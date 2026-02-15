import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCurrentModel, getAvailableModels, switchModel } from '../api/modelApi';
import { supabase } from '../lib/supabase';
import { Layers, Loader2, CheckCircle2, AlertCircle, RefreshCw, XCircle } from 'lucide-react';

interface ModelSelectorProps {
  isAdmin: boolean;
  session?: any;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({ isAdmin, session }) => {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const { data: currentModel, isLoading } = useQuery({
    queryKey: ['current-model'],
    queryFn: getCurrentModel,
    refetchInterval: 5000  // Poll every 5 seconds
  });

  const { data: availableModels } = useQuery({
    queryKey: ['available-models'],
    queryFn: getAvailableModels,
    enabled: isAdmin
  });

  const switchMutation = useMutation({
    mutationFn: async (modelName: string) => {
      // Try session prop first, then fallback to getting session
      let token = session?.access_token;
      console.log('[ModelSelector] Session prop token:', token ? 'exists' : 'missing');

      if (!token) {
        const { data, error } = await supabase.auth.getSession();
        console.log('[ModelSelector] Supabase session:', data?.session ? 'exists' : 'missing', error);
        token = data?.session?.access_token;
      }

      if (!token) {
        console.error('[ModelSelector] No token available');
        throw new Error('Not authenticated - please refresh the page and try again');
      }

      console.log('[ModelSelector] Calling switchModel with token');
      await switchModel(modelName, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-model'] });
      setError(null);
    },
    onError: (err: any) => setError(err.message)
  });

  const forceReloadMutation = useMutation({
    mutationFn: async () => {
      let token = session?.access_token;
      if (!token) {
        const { data } = await supabase.auth.getSession();
        token = data?.session?.access_token;
      }
      if (!token) throw new Error('Not authenticated - please refresh the page');

      // Switch to the same model (forces reload)
      if (!currentModel) throw new Error('No current model');
      await switchModel(currentModel.name, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-model'] });
      setError(null);
    },
    onError: (err: any) => setError(err.message)
  });

  const forceUnloadMutation = useMutation({
    mutationFn: async () => {
      // Call llama-server to unload the model
      const response = await fetch('/llama/v1/models/unload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to unload model');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-model'] });
      setError(null);
    },
    onError: (err: any) => setError(err.message)
  });

  const handleSwitch = (modelName: string) => {
    if (confirm(`Switch to ${modelName}? This will restart the inference server (~30 seconds).`)) {
      switchMutation.mutate(modelName);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'bg-green-400';
      case 'loading': return 'bg-yellow-400 animate-pulse';
      case 'switching': return 'bg-blue-400 animate-pulse';
      default: return 'bg-red-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ready': return 'Ready';
      case 'loading': return 'Loading';
      case 'switching': return 'Switching';
      default: return 'Offline';
    }
  };

  return (
    <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6 shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <Layers className="w-5 h-5 text-accent-cyan" />
        <h3 className="text-lg font-bold">Current Model</h3>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-dark-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading...</span>
        </div>
      ) : currentModel ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${getStatusColor(currentModel.status)}`} />
            <div className="flex-1">
              <p className="text-xl font-bold text-white">{currentModel.alias}</p>
              <p className="text-xs text-dark-400">
                {currentModel.ctx_size.toLocaleString()} token context • {getStatusLabel(currentModel.status)}
              </p>
            </div>
          </div>

          {isAdmin && (
            <>
              {/* Force reload/unload buttons */}
              <div className="pt-4 border-t border-dark-800">
                <p className="text-xs font-bold uppercase text-dark-500 mb-3">Model Control</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      if (confirm('Force reload the current model? This will restart the container (~30 seconds).')) {
                        forceReloadMutation.mutate();
                      }
                    }}
                    disabled={forceReloadMutation.isPending || switchMutation.isPending}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Force Reload
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Unload the current model? This will free GPU memory.')) {
                        forceUnloadMutation.mutate();
                      }
                    }}
                    disabled={forceUnloadMutation.isPending || currentModel?.status === 'offline'}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    <XCircle className="w-4 h-4" />
                    Force Unload
                  </button>
                </div>
              </div>

              {/* Model switcher */}
              {availableModels && availableModels.length > 1 && (
                <div className="pt-4 border-t border-dark-800">
                  <p className="text-xs font-bold uppercase text-dark-500 mb-3">Switch Model</p>
                  <div className="space-y-2">
                    {availableModels.map(model => (
                      <button
                        key={model.name}
                        onClick={() => handleSwitch(model.name)}
                        disabled={model.name === currentModel.name || switchMutation.isPending}
                        className={`w-full text-left px-4 py-2 rounded-lg transition ${
                          model.name === currentModel.name
                            ? 'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20'
                            : 'bg-dark-800 text-white hover:bg-dark-700 border border-dark-700'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{model.alias}</p>
                            <p className="text-xs text-dark-400">{model.ctx_size.toLocaleString()} ctx</p>
                          </div>
                          {model.name === currentModel.name && (
                            <CheckCircle2 className="w-4 h-4 text-accent-cyan" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {error && (
            <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {(switchMutation.isPending || forceReloadMutation.isPending) && (
            <div className="flex items-center gap-2 text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
              <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
              <span className="text-sm">
                {forceReloadMutation.isPending ? 'Reloading model...' : 'Switching model...'}
              </span>
            </div>
          )}

          {forceUnloadMutation.isPending && (
            <div className="flex items-center gap-2 text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
              <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
              <span className="text-sm">Unloading model...</span>
            </div>
          )}
        </div>
      ) : (
        <div className="text-red-400">No model loaded</div>
      )}
    </div>
  );
};
