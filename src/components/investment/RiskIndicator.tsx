'use client';

import React from 'react';
import { RiskLevel, getRiskColor, getRiskLabel } from '@/lib/riskProfiles';

interface RiskIndicatorProps {
    level: RiskLevel;
    returnGuarantee: number;
    size?: 'sm' | 'md' | 'lg';
    showLabel?: boolean;
    showGuarantee?: boolean;
}

export function RiskIndicator({
    level,
    returnGuarantee,
    size = 'md',
    showLabel = true,
    showGuarantee = true,
}: RiskIndicatorProps) {
    const color = getRiskColor(level);
    const label = getRiskLabel(level);

    const sizeClasses = {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
    };

    const dotSizes = {
        sm: 'w-2 h-2',
        md: 'w-3 h-3',
        lg: 'w-4 h-4',
    };

    return (
        <div className={`flex items-center gap-2 ${sizeClasses[size]}`}>
            <span
                className={`${dotSizes[size]} rounded-full`}
                style={{ backgroundColor: color }}
                title={`Risk: ${label}`}
            />
            {showLabel && (
                <span className="font-medium" style={{ color }}>
                    {label}
                </span>
            )}
            {showGuarantee && (
                <span className="text-gray-500 text-xs">
                    ({returnGuarantee}% guaranteed)
                </span>
            )}
        </div>
    );
}

interface RiskMeterProps {
    riskScore: number; // 0-100
    size?: 'sm' | 'md';
}

export function RiskMeter({ riskScore, size = 'md' }: RiskMeterProps) {
    const height = size === 'sm' ? 'h-2' : 'h-3';

    // Color gradient from green to red
    const getColor = (score: number) => {
        if (score < 20) return '#10b981';
        if (score < 40) return '#22c55e';
        if (score < 60) return '#f59e0b';
        if (score < 80) return '#f97316';
        return '#ef4444';
    };

    return (
        <div className="w-full">
            <div className={`w-full ${height} bg-gray-200 rounded-full overflow-hidden`}>
                <div
                    className={`${height} rounded-full transition-all duration-300`}
                    style={{
                        width: `${riskScore}%`,
                        backgroundColor: getColor(riskScore),
                    }}
                />
            </div>
        </div>
    );
}

interface ReturnGuaranteeBadgeProps {
    guarantee: number;
}

export function ReturnGuaranteeBadge({ guarantee }: ReturnGuaranteeBadgeProps) {
    const getColor = (g: number) => {
        if (g >= 90) return 'bg-green-100 text-green-700 border-green-200';
        if (g >= 70) return 'bg-blue-100 text-blue-700 border-blue-200';
        if (g >= 50) return 'bg-amber-100 text-amber-700 border-amber-200';
        return 'bg-red-100 text-red-700 border-red-200';
    };

    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getColor(guarantee)}`}>
            {guarantee}% Guaranteed
        </span>
    );
}
