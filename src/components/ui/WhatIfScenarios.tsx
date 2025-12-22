'use client';

import React from 'react';
import { formatEUR, formatPercent } from '@/lib/formatters';

interface WhatIfSliderProps {
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    unit: 'percent' | 'currency' | 'months';
    onChange: (value: number) => void;
    baseValue?: number;
    showDiff?: boolean;
}

/**
 * What-If scenario slider with real-time value display
 */
export function WhatIfSlider({
    label,
    value,
    min,
    max,
    step,
    unit,
    onChange,
    baseValue,
    showDiff = true,
}: WhatIfSliderProps) {
    const formatValue = (val: number) => {
        switch (unit) {
            case 'percent':
                return formatPercent(val, 1);
            case 'currency':
                return formatEUR(val);
            case 'months':
                return `${val} mo`;
            default:
                return val.toString();
        }
    };

    const diff = baseValue !== undefined ? value - baseValue : 0;
    const diffColor = diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'text-gray-500';

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">{label}</label>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">{formatValue(value)}</span>
                    {showDiff && baseValue !== undefined && diff !== 0 && (
                        <span className={`text-xs ${diffColor}`}>
                            ({diff > 0 ? '+' : ''}{formatValue(diff)})
                        </span>
                    )}
                </div>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-xs text-gray-400">
                <span>{formatValue(min)}</span>
                <span>{formatValue(max)}</span>
            </div>
        </div>
    );
}

interface WhatIfPanelProps {
    scenarios: {
        id: string;
        label: string;
        value: number;
        result: number;
        baseResult: number;
    }[];
}

/**
 * Panel showing multiple What-If scenario results side by side
 */
export function WhatIfPanel({ scenarios }: WhatIfPanelProps) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {scenarios.map((scenario) => {
                const diff = scenario.result - scenario.baseResult;
                const isPositive = diff >= 0;

                return (
                    <div
                        key={scenario.id}
                        className={`p-3 rounded-xl border-2 ${isPositive ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                            }`}
                    >
                        <div className="text-xs text-gray-600 mb-1">{scenario.label}</div>
                        <div className="text-lg font-bold text-gray-800">{formatEUR(scenario.result)}</div>
                        <div className={`text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                            {isPositive ? '↑' : '↓'} {formatEUR(Math.abs(diff))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

interface SensitivityAnalysisProps {
    title: string;
    baseValue: number;
    variations: { label: string; value: number }[];
}

/**
 * Sensitivity analysis showing how results change with different inputs
 */
export function SensitivityAnalysis({ title, baseValue, variations }: SensitivityAnalysisProps) {
    return (
        <div className="space-y-3">
            <h4 className="font-semibold text-gray-800">{title}</h4>
            <div className="space-y-2">
                {variations.map((v, i) => {
                    const diff = v.value - baseValue;
                    const percentChange = baseValue !== 0 ? (diff / baseValue) * 100 : 0;

                    return (
                        <div key={i} className="flex items-center gap-3">
                            <span className="w-24 text-sm text-gray-600">{v.label}</span>
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full ${diff >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                                    style={{
                                        width: `${Math.min(100, Math.abs(percentChange) + 50)}%`,
                                        marginLeft: diff < 0 ? `${50 - Math.abs(percentChange)}%` : '50%',
                                    }}
                                />
                            </div>
                            <span className={`w-20 text-right text-sm font-medium ${diff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {diff >= 0 ? '+' : ''}{formatEUR(diff)}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
