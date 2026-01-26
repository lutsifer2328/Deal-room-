'use client';

import { TimelineStep } from '@/lib/types';
import { useState } from 'react';
import { X, Plus, Trash2, GripVertical } from 'lucide-react';
import { validateTimeline } from '@/lib/defaultTimeline';

interface TimelineEditorProps {
    timeline: TimelineStep[];
    onSave: (newTimeline: TimelineStep[]) => void;
    onClose: () => void;
}

export default function TimelineEditor({ timeline, onSave, onClose }: TimelineEditorProps) {
    const [steps, setSteps] = useState<TimelineStep[]>(JSON.parse(JSON.stringify(timeline)));
    const [error, setError] = useState('');

    const handleLabelChange = (id: string, newLabel: string) => {
        setSteps(steps.map(s => s.id === id ? { ...s, label: newLabel } : s));
        setError('');
    };

    const handleAddStep = () => {
        if (steps.length >= 5) {
            setError('Maximum 5 steps allowed');
            return;
        }

        const newStep: TimelineStep = {
            id: `step_${Date.now()}`,
            label: 'New Step',
            order: steps.length + 1
        };

        setSteps([...steps, newStep]);
        setError('');
    };

    const handleRemoveStep = (id: string) => {
        if (steps.length <= 3) {
            setError('Minimum 3 steps required');
            return;
        }

        const newSteps = steps
            .filter(s => s.id !== id)
            .map((s, index) => ({ ...s, order: index + 1 }));

        setSteps(newSteps);
        setError('');
    };

    const handleSave = () => {
        // Validate
        if (!validateTimeline(steps)) {
            setError('Invalid timeline configuration');
            return;
        }

        // Check for empty labels
        if (steps.some(s => !s.label.trim())) {
            setError('All steps must have a name');
            return;
        }

        onSave(steps);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-midnight text-white">
                    <h2 className="text-lg font-bold">Edit Deal Timeline</h2>
                    <button onClick={onClose} className="text-white/80 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    <p className="text-sm text-gray-600 mb-6">
                        Customize the steps for this deal (3-5 steps). Each step represents a phase in the transaction process.
                    </p>

                    <div className="space-y-3">
                        {steps.map((step, index) => (
                            <div key={step.id} className="flex items-center gap-3 group">
                                {/* Drag Handle */}
                                <div className="text-gray-400 cursor-move">
                                    <GripVertical className="w-5 h-5" />
                                </div>

                                {/* Step Number */}
                                <div className="w-8 h-8 rounded-full bg-teal/10 text-teal font-bold flex items-center justify-center text-sm flex-shrink-0">
                                    {index + 1}
                                </div>

                                {/* Label Input */}
                                <input
                                    type="text"
                                    value={step.label}
                                    onChange={(e) => handleLabelChange(step.id, e.target.value)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal outline-none font-medium"
                                    placeholder="Step name"
                                />

                                {/* Remove Button */}
                                <button
                                    onClick={() => handleRemoveStep(step.id)}
                                    disabled={steps.length <= 3}
                                    className={`p-2 rounded-lg transition-colors ${steps.length <= 3
                                            ? 'text-gray-300 cursor-not-allowed'
                                            : 'text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100'
                                        }`}
                                    title={steps.length <= 3 ? 'Minimum 3 steps required' : 'Remove step'}
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Add Step Button */}
                    {steps.length < 5 && (
                        <button
                            onClick={handleAddStep}
                            className="mt-4 w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-t eal hover:text-teal hover:bg-teal/5 transition-colors flex items-center justify-center gap-2 font-medium"
                        >
                            <Plus className="w-5 h-5" />
                            Add Step ({steps.length}/5)
                        </button>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {/* Info */}
                    <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-800">
                            <strong>💡 Tip:</strong> You can have between 3-5 steps. For simple deals, use fewer steps. For complex transactions, use all 5.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-6 py-2 bg-teal text-white rounded-lg font-bold hover:bg-teal/90 transition-colors"
                    >
                        Save Timeline
                    </button>
                </div>
            </div>
        </div>
    );
}
