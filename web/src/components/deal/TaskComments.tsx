'use client';

import { Task } from '@/lib/types';
import { useData } from '@/lib/store';
import { useAuth } from '@/lib/authContext';
import { MessageSquare, Send, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

export default function TaskComments({ task }: { task: Task }) {
    const { addTaskComment, toggleCommentVisibility } = useData();
    const { user } = useAuth();
    const [newComment, setNewComment] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);

    const isLawyer = user?.role === 'lawyer' || user?.role === 'admin';
    const allComments = task.comments || [];

    // Filter comments based on user role
    const visibleComments = isLawyer
        ? allComments  // Lawyers see all
        : allComments.filter(c => c.isVisibleToAll);  // Others only see visible ones

    const handleAddComment = () => {
        if (newComment.trim() && user) {
            addTaskComment(task.id, user.id, user.name, newComment.trim());
            setNewComment('');
        }
    };

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays}d ago`;
    };

    if (visibleComments.length === 0 && !user) {
        return null; // Don't show if no visible comments and not logged in
    }

    return (
        <div className="border-t border-gray-200 mt-3 pt-3">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-teal transition-colors mb-2"
            >
                <MessageSquare className="w-4 h-4" />
                Comments {visibleComments.length > 0 && `(${visibleComments.length})`}
            </button>

            {isExpanded && (
                <div className="space-y-3">
                    {/* Existing Comments */}
                    {visibleComments.map((comment) => (
                        <div key={comment.id} className="flex gap-2 group">
                            <div className="w-8 h-8 rounded-full bg-teal/10 flex items-center justify-center text-teal font-bold text-xs flex-shrink-0">
                                {comment.authorName.charAt(0)}
                            </div>
                            <div className="flex-1">
                                <div className={`rounded-lg p-3 ${comment.isVisibleToAll ? 'bg-gray-50' : 'bg-yellow-50 border border-yellow-200'}`}>
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-bold text-sm text-midnight">{comment.authorName}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-400">{formatTime(comment.timestamp)}</span>
                                            {isLawyer && (
                                                <button
                                                    onClick={() => toggleCommentVisibility(task.id, comment.id)}
                                                    className={`p-1 rounded hover:bg-white/50 transition-colors ${comment.isVisibleToAll ? 'text-gray-400' : 'text-yellow-600'
                                                        }`}
                                                    title={comment.isVisibleToAll ? 'Hide from participants' : 'Show to participants'}
                                                >
                                                    {comment.isVisibleToAll ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-700">{comment.text}</p>
                                    {!comment.isVisibleToAll && isLawyer && (
                                        <div className="text-xs text-yellow-700 font-medium mt-1 italic">
                                            🔒 Hidden from participants
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Add Comment (Everyone can comment) */}
                    {user && (
                        <div className="flex gap-2 items-start">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${isLawyer ? 'bg-gold/10 text-gold' : 'bg-teal/10 text-teal'
                                }`}>
                                {user.name.charAt(0)}
                            </div>
                            <div className="flex-1 relative">
                                <textarea
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder={isLawyer ? "Leave a note or clarification..." : "Reply to this task..."}
                                    className="w-full px-3 py-2 pr-10 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-teal outline-none resize-none"
                                    rows={2}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleAddComment();
                                        }
                                    }}
                                />
                                {newComment.trim() && (
                                    <button
                                        onClick={handleAddComment}
                                        className="absolute right-2 bottom-2 p-1.5 bg-teal text-white rounded hover:bg-teal/90 transition-colors"
                                        title="Send (Enter)"
                                    >
                                        <Send className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {isLawyer && allComments.length > visibleComments.length && (
                        <div className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded px-2 py-1">
                            💡 You're viewing {allComments.length - visibleComments.length} hidden comment(s) as admin
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
