import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

export const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={cn("glass-card rounded-xl p-6", className)}>{children}</div>
);

export const Button = ({
    children, onClick, variant = 'primary', className, icon: Icon
}: {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: 'primary' | 'outline' | 'ghost';
    className?: string;
    icon?: LucideIcon;
}) => {
    const base = "flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";
    const variants = {
        primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm",
        outline: "border border-input bg-transparent hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground"
    };

    return (
        <button onClick={onClick} className={cn(base, variants[variant], className)}>
            {Icon && <Icon className="w-4 h-4" />}
            {children}
        </button>
    );
};

export const Input = ({ label, value, onChange, type = "number", suffix, className, step }: any) => (
    <div className={cn("flex flex-col gap-2", className)}>
        <label className="text-sm font-medium text-muted-foreground">{label}</label>
        <div className="relative">
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                step={step}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            {suffix && (
                <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">
                    {suffix}
                </span>
            )}
        </div>
    </div>
);
