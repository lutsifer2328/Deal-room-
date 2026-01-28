'use client';

import { useState, useRef, useEffect } from 'react';
import { FileText, History } from 'lucide-react';

interface AutocompleteSuggestion {
    name: string;
    source: 'standard' | 'history';
    standardDocumentId?: string;
}

interface AutocompleteInputProps {
    value: string;
    onChange: (value: string) => void;
    suggestions: AutocompleteSuggestion[];
    placeholder?: string;
    className?: string;
    required?: boolean;
}

export default function AutocompleteInput({
    value,
    onChange,
    suggestions,
    placeholder,
    className,
    required
}: AutocompleteInputProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Filter suggestions based on input
    const filteredSuggestions = suggestions.filter(suggestion =>
        suggestion.name.toLowerCase().includes(value.toLowerCase())
    ).slice(0, 5); // Max 5 suggestions

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node) &&
                inputRef.current &&
                !inputRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        onChange(newValue);
        setIsOpen(newValue.length > 0);
        setSelectedIndex(-1);
    };

    const handleSuggestionClick = (suggestion: AutocompleteSuggestion) => {
        onChange(suggestion.name);
        setIsOpen(false);
        setSelectedIndex(-1);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!isOpen || filteredSuggestions.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev =>
                    prev < filteredSuggestions.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
                break;
            case 'Enter':
                if (selectedIndex >= 0) {
                    e.preventDefault();
                    handleSuggestionClick(filteredSuggestions[selectedIndex]);
                }
                break;
            case 'Escape':
                setIsOpen(false);
                setSelectedIndex(-1);
                break;
        }
    };

    return (
        <div className="relative">
            <input
                ref={inputRef}
                type="text"
                required={required}
                value={value}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => value.length > 0 && setIsOpen(true)}
                placeholder={placeholder}
                className={className}
                autoComplete="off"
            />

            {/* Dropdown */}
            {isOpen && filteredSuggestions.length > 0 && (
                <div
                    ref={dropdownRef}
                    className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                >
                    {filteredSuggestions.map((suggestion, index) => (
                        <button
                            key={`${suggestion.source}-${suggestion.name}`}
                            type="button"
                            onClick={() => handleSuggestionClick(suggestion)}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${index === selectedIndex
                                    ? 'bg-teal/10 text-teal'
                                    : 'hover:bg-gray-50'
                                }`}
                        >
                            {suggestion.source === 'standard' ? (
                                <FileText className="w-4 h-4 text-teal flex-shrink-0" />
                            ) : (
                                <History className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                                <div className="font-medium text-midnight truncate">
                                    {suggestion.name}
                                </div>
                                <div className="text-xs text-gray-500">
                                    {suggestion.source === 'standard' ? 'Standard Document' : 'Previously Used'}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
