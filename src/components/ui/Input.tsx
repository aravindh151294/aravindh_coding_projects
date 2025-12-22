'use client';

import React from 'react';
import { useFormatters } from '@/hooks/useFormatters';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    hint?: string;
    error?: string;
    prefix?: string;
    suffix?: string;
}

export function Input({
    label,
    hint,
    error,
    prefix,
    suffix,
    className = '',
    id,
    type,
    onChange,
    ...props
}: InputProps) {
    const { getInputLang } = useFormatters();
    const inputId = id || label.toLowerCase().replace(/\s+/g, '-');
    const langAttr = getInputLang();

    // Handle onChange to strip leading zeros for number inputs
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (type === 'number' && onChange) {
            const value = e.target.value;
            // Strip leading zeros except for "0." decimal cases
            if (value.length > 1 && value.startsWith('0') && value[1] !== '.') {
                e.target.value = value.replace(/^0+/, '') || '0';
            }
        }
        onChange?.(e);
    };

    return (
        <div className={`space-y-1 ${className}`}>
            <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
                {label}
            </label>
            <div className="relative">
                {prefix && (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                        {prefix}
                    </span>
                )}
                <input
                    id={inputId}
                    type={type}
                    lang={langAttr || undefined}
                    onChange={handleChange}
                    className={`
            w-full px-4 py-2.5 rounded-xl border transition-all duration-200
            ${prefix ? 'pl-8' : ''}
            ${suffix ? 'pr-12' : ''}
            ${error
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                            : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'
                        }
            focus:outline-none focus:ring-2 focus:ring-opacity-50
            bg-white/80 backdrop-blur-sm
          `}
                    {...props}
                />
                {suffix && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                        {suffix}
                    </span>
                )}
            </div>
            {hint && !error && (
                <p className="text-xs text-gray-500">{hint}</p>
            )}
            {error && (
                <p className="text-xs text-red-500">{error}</p>
            )}
        </div>
    );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label: string;
    options: { value: string; label: string }[];
    hint?: string;
}

export function Select({ label, options, hint, className = '', id, ...props }: SelectProps) {
    const selectId = id || label.toLowerCase().replace(/\s+/g, '-');

    return (
        <div className={`space-y-1 ${className}`}>
            <label htmlFor={selectId} className="block text-sm font-medium text-gray-700">
                {label}
            </label>
            <select
                id={selectId}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                {...props}
            >
                {options.map(option => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            {hint && <p className="text-xs text-gray-500">{hint}</p>}
        </div>
    );
}

interface ToggleProps {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    hint?: string;
}

export function Toggle({ label, checked, onChange, hint }: ToggleProps) {
    return (
        <div className="flex items-center justify-between">
            <div>
                <span className="text-sm font-medium text-gray-700">{label}</span>
                {hint && <p className="text-xs text-gray-500">{hint}</p>}
            </div>
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                onClick={() => onChange(!checked)}
                className={`
          relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200
          ${checked ? 'bg-gradient-to-r from-blue-500 to-purple-600' : 'bg-gray-200'}
        `}
            >
                <span
                    className={`
            inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-200
            ${checked ? 'translate-x-6' : 'translate-x-1'}
          `}
                />
            </button>
        </div>
    );
}
