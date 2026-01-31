'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | 'full';
}

const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    full: 'max-w-full m-4',
};

export function Modal({ isOpen, onClose, children, className, size = 'md' }: ModalProps) {
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.body.style.overflow = 'unset';
            setMounted(false);
        };
    }, [isOpen]);

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Modal Content Wrapper */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ type: "spring", duration: 0.4, bounce: 0 }}
                        className={cn(
                            "relative bg-white rounded-xl shadow-2xl w-full flex flex-col max-h-[90vh]",
                            sizeClasses[size],
                            className
                        )}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {children}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}

interface ModalHeaderProps {
    children: React.ReactNode;
    onClose?: () => void;
    className?: string;
}

export function ModalHeader({ children, onClose, className }: ModalHeaderProps) {
    return (
        <div className={cn("px-6 py-4 border-b border-gray-100 flex justify-between items-center flex-shrink-0 text-midnight", className)}>
            <div className="text-lg font-bold flex-1">{children}</div>
            {onClose && (
                <Button variant="ghost" size="icon" onClick={onClose} className="text-current hover:text-current/80 -mr-2 opacity-50 hover:opacity-100">
                    <X className="w-5 h-5" />
                </Button>
            )}
        </div>
    );
}

interface ModalContentProps {
    children: React.ReactNode;
    className?: string;
}

export function ModalContent({ children, className }: ModalContentProps) {
    return (
        <div className={cn("p-6 overflow-y-auto flex-1 min-h-0", className)}>
            {children}
        </div>
    );
}

interface ModalFooterProps {
    children: React.ReactNode;
    className?: string;
}

export function ModalFooter({ children, className }: ModalFooterProps) {
    return (
        <div className={cn("px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 flex-shrink-0 rounded-b-xl", className)}>
            {children}
        </div>
    );
}
