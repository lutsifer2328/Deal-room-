'use client';

import { Deal } from '@/lib/types';
import { useData } from '@/lib/store';
import { useAuth } from '@/lib/authContext';
import { Check, Settings } from 'lucide-react';
import { useState } from 'react';
import TimelineEditor from './TimelineEditor';

export default function SingleProgressBar({ deal }: { deal: Deal }) {
    const { updateDealTimeline, updateCurrentStepId } = useData();
    const { user } = useAuth();
    const [confirmingStepId, setConfirmingStepId] = useState<string | null>(null);
    const [isEditingTimeline, setIsEditingTimeline] = useState(false);

    const steps = deal.timeline || [];
    const currentIndex = steps.findIndex(s => s.id === deal.currentStepId);
    const isLawyer = user?.role === 'lawyer' || user?.role === 'admin';

    const handleStepClick = (stepId: string) => {
        if (!isLawyer) return;
        setConfirmingStepId(stepId);
    };

    const confirmStepChange = () => {
        if (confirmingStepId && user) {
            // Use proper store action to update current step ID
            updateCurrentStepId(deal.id, confirmingStepId, user.id);
            setConfirmingStepId(null);
        }
    };

    const handleSaveTimeline = (newTimeline: typeof steps) => {
        if (user) {
            updateDealTimeline(deal.id, newTimeline, user.id);
        }
    };

    const confirmingStep = steps.find(s => s.id === confirmingStepId);

    return (
        <>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wider">Transaction Progress</h3>
                    {isLawyer && (
                        <button
                            onClick={() => setIsEditingTimeline(true)}
                            className="flex items-center gap-1 text-xs text-gray-600 hover:text-teal transition-colors px-3 py-1.5 rounded-lg hover:bg-teal/5"
                        >
                            <Settings className="w-3.5 h-3.5" />
                            Edit Timeline
                        </button>
                    )}
                </div>

                <div className="relative">
                    {/* Progress Line */}
                    <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 rounded-full">
                        <div
                            className="h-full bg-teal rounded-full transition-all duration-500"
                            style={{ width: `${currentIndex >= 0 ? (currentIndex / (steps.length - 1)) * 100 : 0}%` }}
                        />
                    </div>

                    {/* Steps */}
                    <div className="relative flex justify-between">
                        {steps.map((step, index) => {
                            const isPast = index < currentIndex;
                            const isCurrent = index === currentIndex;
                            const isClickable = isLawyer;

                            return (
                                <button
                                    key={step.id}
                                    onClick={() => isClickable && handleStepClick(step.id)}
                                    disabled={!isClickable}
                                    className={`flex flex-col items-center gap-2 transition-all ${isClickable ? 'cursor-pointer hover:scale-105' : 'cursor-default'
                                        }`}
                                    title={isClickable ? `Click to move to ${step.label}` : ''}
                                >
                                    {/* Circle */}
                                    <div
                                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all z-10 ${isPast
                                                ? 'bg-teal border-teal text-white'
                                                : isCurrent
                                                    ? 'bg-white border-teal text-teal shadow-lg ring-4 ring-teal/20'
                                                    : 'bg-white border-gray-300 text-gray-400'
                                            } ${isClickable ? 'hover:shadow-xl hover:border-teal hover:text-teal' : ''}`}
                                    >
                                        {isPast ? <Check className="w-5 h-5" /> : index + 1}
                                    </div>

                                    {/* Label */}
                                    <span
                                        className={`text-xs font-medium text-center max-w-[120px] ${isCurrent ? 'text-teal font-bold' : isPast ? 'text-gray-700' : 'text-gray-400'
                                            }`}
                                    >
                                        {step.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {isLawyer && (
                        <p className="text-xs text-gray-500 text-center mt-4 italic">
                            💡 Click any step to move the deal to that phase
                        </p>
                    )}
                </div>
            </div>

            {/* Confirmation Dialog */}
            {confirmingStep && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md animate-in fade-in zoom-in duration-200">
                        <h3 className="text-lg font-bold text-midnight mb-2">Change Deal Phase?</h3>
                        <p className="text-gray-600 mb-6">
                            Move this deal to <strong className="text-teal">{confirmingStep.label}</strong> phase?
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setConfirmingStepId(null)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmStepChange}
                                className="px-4 py-2 bg-teal text-white rounded-lg font-bold hover:bg-teal/90"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Timeline Editor */}
            {isEditingTimeline && (
                <TimelineEditor
                    timeline={steps}
                    onSave={handleSaveTimeline}
                    onClose={() => setIsEditingTimeline(false)}
                />
            )}
        </>
    );
}
