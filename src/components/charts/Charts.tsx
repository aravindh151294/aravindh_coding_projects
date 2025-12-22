'use client';

import React from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { formatEUR, formatNumber } from '@/lib/formatters';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

// Custom tooltip callback to use period decimal separator
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const tooltipCallback = {
    label: function (context: any) {
        const label = context.dataset?.label || '';
        const value = typeof context.parsed === 'object' ? context.parsed?.y : context.parsed;
        return `${label}: ${formatEUR(value || 0)}`;
    }
};


interface LineChartProps {
    data: { label: string; value: number }[];
    title?: string;
    color?: string;
    fillGradient?: boolean;
}

export function LineChart({ data, title, color = '#3b82f6', fillGradient = true }: LineChartProps) {
    const chartData = {
        labels: data.map(d => d.label),
        datasets: [
            {
                label: title || 'Value',
                data: data.map(d => d.value),
                borderColor: color,
                backgroundColor: fillGradient ? `${color}20` : 'transparent',
                fill: fillGradient,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 6,
                pointHoverBackgroundColor: color,
                pointHoverBorderColor: '#fff',
                pointHoverBorderWidth: 2,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(0,0,0,0.8)',
                padding: 12,
                cornerRadius: 8,
                titleFont: { size: 14, weight: 'bold' as const },
                bodyFont: { size: 13 },
                callbacks: tooltipCallback,
            },
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { color: '#9ca3af' },
            },
            y: {
                grid: { color: 'rgba(0,0,0,0.05)' },
                ticks: {
                    color: '#9ca3af',
                    callback: function (value: number | string) {
                        return formatNumber(Number(value), 0);
                    }
                },
            },
        },
        interaction: {
            intersect: false,
            mode: 'index' as const,
        },
    };

    return (
        <div className="h-64">
            <Line data={chartData} options={options} />
        </div>
    );
}

interface ComparisonChartProps {
    scenarios: {
        name: string;
        totalPayment: number;
        totalInterest: number;
        color: string;
    }[];
}

export function ComparisonChart({ scenarios }: ComparisonChartProps) {
    const chartData = {
        labels: scenarios.map(s => s.name),
        datasets: [
            {
                label: 'Principal',
                data: scenarios.map(s => s.totalPayment - s.totalInterest),
                backgroundColor: '#3b82f6',
                borderRadius: 8,
            },
            {
                label: 'Interest',
                data: scenarios.map(s => s.totalInterest),
                backgroundColor: '#f59e0b',
                borderRadius: 8,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom' as const,
                labels: { usePointStyle: true, padding: 20 },
            },
            tooltip: {
                backgroundColor: 'rgba(0,0,0,0.8)',
                padding: 12,
                cornerRadius: 8,
                callbacks: tooltipCallback,
            },
        },
        scales: {
            x: {
                grid: { display: false },
                stacked: true,
            },
            y: {
                grid: { color: 'rgba(0,0,0,0.05)' },
                stacked: true,
                ticks: {
                    callback: function (value: number | string) {
                        return formatNumber(Number(value), 0);
                    }
                },
            },
        },
    };

    return (
        <div className="h-72">
            <Bar data={chartData} options={options} />
        </div>
    );
}

interface DoughnutChartProps {
    principal: number;
    interest: number;
    title?: string;
}

export function DoughnutChart({ principal, interest, title }: DoughnutChartProps) {
    const chartData = {
        labels: ['Principal', 'Interest'],
        datasets: [
            {
                data: [principal, interest],
                backgroundColor: ['#3b82f6', '#f59e0b'],
                borderWidth: 0,
                cutout: '70%',
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom' as const,
                labels: { usePointStyle: true, padding: 16 },
            },
            tooltip: {
                backgroundColor: 'rgba(0,0,0,0.8)',
                padding: 12,
                cornerRadius: 8,
                callbacks: tooltipCallback,
            },
        },
    };

    return (
        <div className="h-64 relative">
            <Doughnut data={chartData} options={options} />
            {title && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-sm font-medium text-gray-600">{title}</span>
                </div>
            )}
        </div>
    );
}

interface AllocationChartProps {
    allocations: {
        name: string;
        amount: number;
        color: string;
    }[];
    title?: string;
}

const ALLOCATION_COLORS = [
    '#3b82f6', // Blue - FD
    '#10b981', // Green - Govt Bonds
    '#8b5cf6', // Purple - Corp Bonds
    '#f59e0b', // Amber - Gold
    '#ef4444', // Red - MF/ETF
    '#ec4899', // Pink - Equity
];

export function AllocationChart({ allocations, title }: AllocationChartProps) {
    const chartData = {
        labels: allocations.map(a => a.name),
        datasets: [
            {
                data: allocations.map(a => a.amount),
                backgroundColor: allocations.map((_, i) => ALLOCATION_COLORS[i % ALLOCATION_COLORS.length]),
                borderWidth: 2,
                borderColor: '#ffffff',
                cutout: '60%',
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right' as const,
                labels: {
                    usePointStyle: true,
                    padding: 12,
                    font: { size: 11 },
                },
            },
            tooltip: {
                backgroundColor: 'rgba(0,0,0,0.8)',
                padding: 12,
                cornerRadius: 8,
                callbacks: {
                    label: function (context: { label?: string; parsed?: number }) {
                        const total = allocations.reduce((sum, a) => sum + a.amount, 0);
                        const value = context.parsed || 0;
                        const percentage = ((value / total) * 100).toFixed(1);
                        return `${context.label}: ${formatEUR(value)} (${percentage}%)`;
                    }
                },
            },
        },
    };

    return (
        <div className="h-48 relative">
            <Doughnut data={chartData} options={options} />
            {title && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ marginRight: '80px' }}>
                    <span className="text-xs font-medium text-gray-500">{title}</span>
                </div>
            )}
        </div>
    );
}

