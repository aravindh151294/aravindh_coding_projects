'use client';

import React, { useState } from 'react';

interface TooltipProps {
    term: string;
    children: React.ReactNode;
}

/**
 * Educational tooltip that explains financial terms
 */
export function EducationalTooltip({ term, children }: TooltipProps) {
    const [isOpen, setIsOpen] = useState(false);

    const definitions: Record<string, { title: string; explanation: string; example?: string }> = {
        'compounding': {
            title: 'Compound Interest',
            explanation: 'Interest calculated on both the initial principal and accumulated interest. More frequent compounding = higher returns.',
            example: 'Monthly compounding on €10,000 at 7% yields more than yearly compounding.',
        },
        'risk': {
            title: 'Investment Risk',
            explanation: 'The possibility that your actual returns differ from expected returns. Higher risk often means higher potential returns, but also higher potential losses.',
            example: 'Equity: High risk, 15% avg return. FD: Low risk, 7% guaranteed.',
        },
        'break-even': {
            title: 'Break-Even Point',
            explanation: 'The point in time when your investment returns equal your costs or alternative options.',
            example: 'If investing beats loan prepayment after 24 months, that\'s your break-even.',
        },
        'weighted-rate': {
            title: 'Weighted Average Rate',
            explanation: 'Average return rate where each investment\'s rate is weighted by its allocation percentage.',
            example: '50% at 7% + 50% at 12% = 9.5% weighted average.',
        },
        'inflation': {
            title: 'Inflation Adjustment',
            explanation: 'Accounts for the decrease in purchasing power over time. Real returns = Nominal returns - Inflation rate.',
            example: '10% return with 6% inflation = 4% real return.',
        },
        'prepayment': {
            title: 'Loan Prepayment',
            explanation: 'Paying off part or all of your loan before the scheduled date. Reduces total interest but may incur penalties.',
            example: 'Prepaying €10,000 on a €100,000 loan can save thousands in interest.',
        },
        'emi': {
            title: 'EMI (Equated Monthly Installment)',
            explanation: 'Fixed monthly payment that includes both principal and interest. Remains constant throughout the loan term.',
        },
        'maturity': {
            title: 'Maturity Amount',
            explanation: 'The total amount you receive when the investment term ends, including principal and all accumulated interest.',
        },
        'guarantee': {
            title: 'Return Guarantee',
            explanation: 'How confident you can be that the stated return will be achieved. FDs are nearly 100% guaranteed; equities are not.',
        },
    };

    const info = definitions[term] || { title: term, explanation: 'No definition available.' };

    return (
        <span className="relative inline-block">
            <button
                onClick={() => setIsOpen(!isOpen)}
                onMouseEnter={() => setIsOpen(true)}
                onMouseLeave={() => setIsOpen(false)}
                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 cursor-help"
            >
                {children}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </button>
            {isOpen && (
                <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-72 p-3 bg-gray-900 text-white text-sm rounded-xl shadow-xl">
                    <div className="font-semibold mb-1">{info.title}</div>
                    <div className="text-gray-300 text-xs">{info.explanation}</div>
                    {info.example && (
                        <div className="mt-2 pt-2 border-t border-gray-700 text-xs text-blue-300">
                            💡 {info.example}
                        </div>
                    )}
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                        <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-gray-900"></div>
                    </div>
                </div>
            )}
        </span>
    );
}

interface InfoIconProps {
    term: string;
}

/**
 * Standalone info icon with tooltip
 */
export function InfoIcon({ term }: InfoIconProps) {
    return (
        <EducationalTooltip term={term}>
            <span className="sr-only">Learn more</span>
        </EducationalTooltip>
    );
}
