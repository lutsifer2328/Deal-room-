'use client';

import { useData } from '@/lib/store';
import { History, X } from 'lucide-react';
import { useState } from 'react';

export default function AuditLogPanel() {
    const { logs } = useData();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 right-4 z-40 bg-white text-midnight p-3 rounded-full shadow-lg border border-gray-200 hover:bg-gray-50 flex items-center gap-2"
            >
                <History className="w-5 h-5" />
                <span className="text-sm font-bold">Activity Log</span>
            </button>

            {isOpen && (
                <div className="fixed inset-y-0 right-0 z-50 w-96 bg-white shadow-2xl animate-in slide-in-from-right duration-200 flex flex-col">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <h2 className="font-bold text-midnight flex items-center gap-2">
                            <History className="w-5 h-5" />
                            Deal Activity Log
                        </h2>
                        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-midnight">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {logs.length === 0 ? (
                            <div className="text-center text-gray-400 italic mt-10">No activity recorded yet.</div>
                        ) : (
                            logs.map(log => (
                                <div key={log.id} className="border-l-2 border-gray-200 pl-4 py-1">
                                    <div className="text-xs text-gray-400 mb-1">
                                        {new Date(log.timestamp).toLocaleString()}
                                    </div>
                                    <div className="text-sm font-medium text-midnight">
                                        <span className="font-bold">{log.actorName}</span> {getVerb(log.action)}
                                    </div>
                                    <div className="text-xs text-gray-500 italic mt-0.5">
                                        {log.details}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </>
    );
}

function getVerb(action: string) {
    switch (action) {
        case 'CREATED_DEAL': return 'created the deal';
        case 'ADDED_TASK': return 'added a requirement';
        case 'VERIFIED_DOC': return 'verified a document';
        case 'RELEASED_DOC': return 'released a document';
        case 'REJECTED_DOC': return 'rejected a document';
        default: return 'performed an action';
    }
}
