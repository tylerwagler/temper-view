import React from 'react';

interface GPUDetailsModalProps {
    gpu: any; // Using any for simplicity as per existing patterns, or could define interface
    onClose: () => void;
}

export const GPUDetailsModal: React.FC<GPUDetailsModalProps> = ({ gpu, onClose }) => {
    if (!gpu) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative bg-dark-800 rounded-xl shadow-2xl border border-dark-700 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-dark-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white flex items-center gap-3">
                        <span className="bg-accent-cyan/10 p-2 rounded-lg text-accent-cyan">
                            GPU {gpu.index}
                        </span>
                        {gpu.name}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-dark-400 hover:text-white transition-colors"
                    >
                        ✕
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Identity Section */}
                    <div>
                        <h3 className="text-sm font-semibold text-dark-400 uppercase tracking-wider mb-3">Identity</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-dark-900/50 p-3 rounded-lg border border-dark-700/50">
                                <span className="block text-xs text-dark-500 mb-1">Serial Number</span>
                                <span className="font-mono text-white text-sm">{gpu.serial}</span>
                            </div>
                            <div className="bg-dark-900/50 p-3 rounded-lg border border-dark-700/50">
                                <span className="block text-xs text-dark-500 mb-1">VBIOS Version</span>
                                <span className="font-mono text-white text-sm">{gpu.vbios}</span>
                            </div>
                        </div>
                    </div>

                    {/* State Section */}
                    <div>
                        <h3 className="text-sm font-semibold text-dark-400 uppercase tracking-wider mb-3">State</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-dark-900/50 p-3 rounded-lg border border-dark-700/50">
                                <span className="block text-xs text-dark-500 mb-1">Performance State</span>
                                <span className="font-mono text-white text-sm flex items-center gap-2">
                                    P{gpu.p_state.id}
                                    <span className="text-[10px] bg-dark-700 px-1.5 rounded text-dark-300">
                                        ({gpu.p_state.description})
                                    </span>
                                </span>
                            </div>
                            <div className="bg-dark-900/50 p-3 rounded-lg border border-dark-700/50">
                                <span className="block text-xs text-dark-500 mb-1">Bus ID</span>
                                <span className="font-mono text-white text-sm">{gpu.index} (PCIe)</span>
                            </div>
                        </div>
                    </div>

                    {/* Capacity Section - Just extra detail */}
                    <div>
                        <h3 className="text-sm font-semibold text-dark-400 uppercase tracking-wider mb-3">Capabilities</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-dark-900/50 p-3 rounded-lg border border-dark-700/50">
                                <span className="block text-xs text-dark-500 mb-1">Total Memory</span>
                                <span className="font-mono text-white text-sm">
                                    {gpu.resources?.memory_total_mb} MB
                                </span>
                            </div>
                            <div className="bg-dark-900/50 p-3 rounded-lg border border-dark-700/50">
                                <span className="block text-xs text-dark-500 mb-1">Power Limit</span>
                                <span className="font-mono text-white text-sm">
                                    {(gpu.power_limit_mw / 1000).toFixed(0)} W
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-dark-900/30 border-t border-dark-700 text-center">
                    <button
                        onClick={onClose}
                        className="text-sm text-dark-400 hover:text-white transition-colors"
                    >
                        Close Details
                    </button>
                </div>
            </div>
        </div>
    );
};
