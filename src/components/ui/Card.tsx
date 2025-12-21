import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    variant?: 'default' | 'gradient' | 'glass';
    padding?: 'sm' | 'md' | 'lg';
}

export function Card({
    children,
    className = '',
    variant = 'default',
    padding = 'md'
}: CardProps) {
    const baseStyles = 'rounded-2xl transition-all duration-300';

    const variantStyles = {
        default: 'bg-white/80 backdrop-blur-sm border border-gray-100 shadow-lg hover:shadow-xl',
        gradient: 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg hover:shadow-xl',
        glass: 'bg-white/20 backdrop-blur-md border border-white/30 shadow-lg',
    };

    const paddingStyles = {
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
    };

    return (
        <div className={`${baseStyles} ${variantStyles[variant]} ${paddingStyles[padding]} ${className}`}>
            {children}
        </div>
    );
}

interface CardHeaderProps {
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
    action?: React.ReactNode;
}

export function CardHeader({ title, subtitle, icon, action }: CardHeaderProps) {
    return (
        <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
                {icon && (
                    <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                        {icon}
                    </div>
                )}
                <div>
                    <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
                    {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
                </div>
            </div>
            {action && <div>{action}</div>}
        </div>
    );
}
