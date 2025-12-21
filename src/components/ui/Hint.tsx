import React from 'react';

interface HintProps {
    children: React.ReactNode;
    type?: 'info' | 'tip' | 'warning';
    className?: string;
}

export function Hint({ children, type = 'info', className = '' }: HintProps) {
    const typeStyles = {
        info: 'bg-blue-50 border-blue-200 text-blue-700',
        tip: 'bg-green-50 border-green-200 text-green-700',
        warning: 'bg-amber-50 border-amber-200 text-amber-700',
    };

    const icons = {
        info: (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
        ),
        tip: (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
        ),
        warning: (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
        ),
    };

    return (
        <div className={`flex items-start gap-2 p-3 rounded-xl border ${typeStyles[type]} ${className}`}>
            <span className="flex-shrink-0 mt-0.5">{icons[type]}</span>
            <p className="text-sm">{children}</p>
        </div>
    );
}

interface StatCardProps {
    label: string;
    value: string;
    subValue?: string;
    trend?: 'up' | 'down' | 'neutral';
    icon?: React.ReactNode;
    className?: string;
}

export function StatCard({ label, value, subValue, trend, icon, className = '' }: StatCardProps) {
    const trendColors = {
        up: 'text-green-500',
        down: 'text-red-500',
        neutral: 'text-gray-500',
    };

    return (
        <div className={`p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 ${className}`}>
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
                {icon && <span className="text-gray-400">{icon}</span>}
            </div>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
            {subValue && (
                <p className={`text-sm mt-1 ${trend ? trendColors[trend] : 'text-gray-500'}`}>
                    {subValue}
                </p>
            )}
        </div>
    );
}

interface TabsProps {
    tabs: { id: string; label: string }[];
    activeTab: string;
    onChange: (id: string) => void;
}

export function Tabs({ tabs, activeTab, onChange }: TabsProps) {
    return (
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => onChange(tab.id)}
                    className={`
            flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200
            ${activeTab === tab.id
                            ? 'bg-white text-gray-800 shadow-sm'
                            : 'text-gray-600 hover:text-gray-800'
                        }
          `}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
}

interface BadgeProps {
    children: React.ReactNode;
    variant?: 'default' | 'success' | 'warning' | 'danger';
    className?: string;
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
    const variantStyles = {
        default: 'bg-blue-100 text-blue-700',
        success: 'bg-green-100 text-green-700',
        warning: 'bg-amber-100 text-amber-700',
        danger: 'bg-red-100 text-red-700',
    };

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantStyles[variant]} ${className}`}>
            {children}
        </span>
    );
}
