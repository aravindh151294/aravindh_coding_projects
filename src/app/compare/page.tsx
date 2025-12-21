'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardHeader, Button, Select, Hint, StatCard, Badge } from '@/components/ui';
import { ComparisonChart } from '@/components/charts';
import { useLoanCalculator } from '@/hooks/useLoanCalculator';
import { useFDCalculator } from '@/hooks/useFDCalculator';
import { useCurrency } from '@/hooks/useCurrency';
import { formatEUR, formatINR, formatDuration, formatPercent } from '@/lib/formatters';
import { HINTS } from '@/lib/constants';

export default function ComparePage() {
    const { inputs: loanInputs, scenarioA, scenarioB, scenarioC, savings } = useLoanCalculator();
    const { inputs: fdInputs, result: fdResult } = useFDCalculator();
    const { exchangeRate, convertToINR } = useCurrency();

    const [selectedScenario, setSelectedScenario] = useState<'B' | 'C'>('B');

    const scenarios = {
        A: { name: 'Original', result: scenarioA, savings: 0 },
        B: { name: 'Prepayment', result: scenarioB, savings: savings.savingsB },
        C: { name: 'Aggressive', result: scenarioC, savings: savings.savingsC },
    };

    const selected = scenarios[selectedScenario];

    // Calculate what if the savings were invested in FD instead
    const fdOnSavings = useMemo(() => {
        const savingsAmount = selected.savings;
        if (savingsAmount <= 0) return null;

        // Calculate FD return on the savings amount over the remaining loan period
        const monthsSaved = selected.result.monthsSaved || 0;
        const fdRate = fdInputs.annualRate / 100;
        const years = (loanInputs.termMonths - monthsSaved) / 12;

        // Compound interest on savings
        const fdReturn = savingsAmount * Math.pow(1 + fdRate / 4, 4 * years);
        const fdInterest = fdReturn - savingsAmount;

        return {
            principal: savingsAmount,
            maturity: fdReturn,
            interest: fdInterest,
        };
    }, [selected, fdInputs.annualRate, loanInputs.termMonths]);

    // Net comparison: Loan savings vs FD opportunity cost
    const comparison = useMemo(() => {
        const loanSavings = selected.savings;
        const fdOpportunityCost = fdResult.totalInterest * (loanInputs.termMonths / fdInputs.termMonths);
        const netBenefit = loanSavings - fdOpportunityCost;

        return {
            loanSavings,
            fdOpportunityCost: fdOpportunityCost > 0 ? fdOpportunityCost : 0,
            netBenefit,
            recommendation: netBenefit > 0 ? 'prepay' : 'invest',
        };
    }, [selected, fdResult, loanInputs.termMonths, fdInputs.termMonths]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Compare Scenarios</h1>
                <p className="text-gray-600">Should you prepay your loan or invest in FD?</p>
            </div>

            {/* Scenario Selection */}
            <Card>
                <CardHeader title="Select Scenario to Compare" subtitle="Compare against Scenario A (Original)" />
                <div className="flex gap-4">
                    <button
                        onClick={() => setSelectedScenario('B')}
                        className={`flex-1 p-4 rounded-xl border-2 transition-all ${selectedScenario === 'B'
                                ? 'border-purple-500 bg-purple-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                    >
                        <h4 className="font-semibold text-gray-800">Scenario B</h4>
                        <p className="text-sm text-gray-600">With Prepayment</p>
                        <Badge variant="success" className="mt-2">Save {formatEUR(savings.savingsB)}</Badge>
                    </button>
                    <button
                        onClick={() => setSelectedScenario('C')}
                        className={`flex-1 p-4 rounded-xl border-2 transition-all ${selectedScenario === 'C'
                                ? 'border-green-500 bg-green-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                    >
                        <h4 className="font-semibold text-gray-800">Scenario C</h4>
                        <p className="text-sm text-gray-600">Aggressive Repayment</p>
                        <Badge variant="success" className="mt-2">Save {formatEUR(savings.savingsC)}</Badge>
                    </button>
                </div>
            </Card>

            {/* Comparison Overview */}
            <div className="grid md:grid-cols-3 gap-4">
                <StatCard
                    label="Loan Interest Saved"
                    value={formatEUR(comparison.loanSavings)}
                    subValue={formatINR(convertToINR(comparison.loanSavings))}
                    trend="up"
                />
                <StatCard
                    label="FD Opportunity Cost"
                    value={formatEUR(comparison.fdOpportunityCost)}
                    subValue="If invested in FD instead"
                    trend="down"
                />
                <StatCard
                    label="Net Benefit"
                    value={formatEUR(comparison.netBenefit)}
                    subValue={formatINR(convertToINR(comparison.netBenefit))}
                    trend={comparison.netBenefit > 0 ? 'up' : 'down'}
                />
            </div>

            {/* Recommendation */}
            <Card variant={comparison.recommendation === 'prepay' ? 'gradient' : 'default'}>
                <div className="text-center py-4">
                    <div className="text-4xl mb-2">
                        {comparison.recommendation === 'prepay' ? '✅' : '💰'}
                    </div>
                    <h3 className="text-xl font-bold mb-2">
                        {comparison.recommendation === 'prepay'
                            ? 'Prepaying is the Better Choice!'
                            : 'Consider Investing in FD'
                        }
                    </h3>
                    <p className={comparison.recommendation === 'prepay' ? 'text-white/80' : 'text-gray-600'}>
                        {comparison.recommendation === 'prepay'
                            ? `You save ${formatEUR(comparison.netBenefit)} more by prepaying your loan compared to investing in FD.`
                            : `FD investment might give you better returns. However, being debt-free has its own peace of mind value!`
                        }
                    </p>
                </div>
            </Card>

            {/* Detailed Comparison */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Loan Scenario Details */}
                <Card>
                    <CardHeader
                        title={`Scenario ${selectedScenario}: ${selected.name}`}
                        subtitle="Loan repayment strategy"
                    />
                    <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Total Payment</span>
                            <span className="font-medium">{formatEUR(selected.result.totalPayment)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Total Interest</span>
                            <span className="font-medium">{formatEUR(selected.result.totalInterest)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Months to Clear</span>
                            <span className="font-medium">{selected.result.schedule.length} months</span>
                        </div>
                        {selected.result.monthsSaved && selected.result.monthsSaved > 0 && (
                            <div className="flex justify-between text-sm text-green-600">
                                <span>Months Saved</span>
                                <span className="font-medium">{selected.result.monthsSaved} months</span>
                            </div>
                        )}
                        <div className="pt-3 border-t">
                            <div className="flex justify-between font-semibold">
                                <span>Interest Saved vs A</span>
                                <span className="text-green-600">{formatEUR(selected.savings)}</span>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* FD Alternative */}
                <Card>
                    <CardHeader
                        title="FD Alternative"
                        subtitle={`If you invest in FD at ${formatPercent(fdInputs.annualRate)}`}
                    />
                    <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Investment Amount</span>
                            <span className="font-medium">{formatEUR(fdInputs.principal)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Maturity Amount</span>
                            <span className="font-medium">{formatEUR(fdResult.maturityAmount)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Interest Earned</span>
                            <span className="font-medium text-green-600">{formatEUR(fdResult.totalInterest)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Term</span>
                            <span className="font-medium">{formatDuration(fdInputs.termMonths)}</span>
                        </div>
                        <div className="pt-3 border-t">
                            <div className="flex justify-between font-semibold">
                                <span>Total Returns</span>
                                <span className="text-blue-600">{formatEUR(fdResult.totalInterest)}</span>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Visual Comparison */}
            <Card>
                <CardHeader title="Visual Comparison" subtitle="All scenarios at a glance" />
                <ComparisonChart
                    scenarios={[
                        {
                            name: 'A: Original',
                            totalPayment: scenarioA.totalPayment,
                            totalInterest: scenarioA.totalInterest,
                            color: '#64748b'
                        },
                        {
                            name: `${selectedScenario}: ${selected.name}`,
                            totalPayment: selected.result.totalPayment,
                            totalInterest: selected.result.totalInterest,
                            color: selectedScenario === 'B' ? '#8b5cf6' : '#10b981'
                        },
                    ]}
                />
            </Card>

            {/* Savings in Both Currencies */}
            <Card variant="gradient">
                <div className="text-center py-4">
                    <h3 className="text-xl font-bold mb-4">Net Savings Summary</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/20 rounded-xl p-4">
                            <p className="text-sm text-white/80">In EUR</p>
                            <p className="text-3xl font-bold">{formatEUR(comparison.netBenefit)}</p>
                        </div>
                        <div className="bg-white/20 rounded-xl p-4">
                            <p className="text-sm text-white/80">In INR</p>
                            <p className="text-3xl font-bold">{formatINR(convertToINR(comparison.netBenefit))}</p>
                        </div>
                    </div>
                    <p className="text-xs text-white/60 mt-4">
                        Net Savings = Interest saved from {selected.name} strategy - FD opportunity cost
                    </p>
                </div>
            </Card>

            {/* Hints */}
            <div className="space-y-4">
                <Hint type="info">{HINTS.general.savings}</Hint>
                <Hint type="tip">{HINTS.fd.comparison}</Hint>
            </div>
        </div>
    );
}
