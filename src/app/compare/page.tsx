'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardHeader, Toggle, Hint, StatCard, Badge } from '@/components/ui';
import { ComparisonChart } from '@/components/charts';
import { useLoanCalculator } from '@/hooks/useLoanCalculator';
import { useFDCalculator } from '@/hooks/useFDCalculator';
import { useCurrency } from '@/hooks/useCurrency';
import { useFormatters, formatDuration } from '@/hooks/useFormatters';
import { calculateBreakEvenMonth, calculateNetSavings } from '@/lib/calculations';
import { HINTS } from '@/lib/constants';

export default function ComparePage() {
    const { inputs: loanInputs, scenarioA, scenarioB, scenarioC, savings } = useLoanCalculator();
    const { inputs: investmentInputs, result: investmentResult } = useFDCalculator();
    const { convertToINR } = useCurrency();
    const { formatEUR, formatINR, formatPercent } = useFormatters();

    const [selectedScenario, setSelectedScenario] = useState<'B' | 'C'>('B');
    const [linkedToLoan, setLinkedToLoan] = useState(true);
    const [whatIfAdjustment, setWhatIfAdjustment] = useState(2); // Default ±2%

    const scenarios = {
        A: { name: 'Original', result: scenarioA, savings: 0 },
        B: { name: 'Prepayment', result: scenarioB, savings: savings.savingsB },
        C: { name: 'Aggressive', result: scenarioC, savings: savings.savingsC },
    };

    const selected = scenarios[selectedScenario];

    // Investment amount based on mode
    const investmentAmount = linkedToLoan ? loanInputs.principal : investmentInputs.principal;

    // Calculate investment returns for the investment amount over loan term
    const investmentReturns = useMemo(() => {
        const rate = investmentResult.weightedRate / 100;
        const years = loanInputs.termMonths / 12;
        const n = 4; // quarterly compounding
        const maturity = investmentAmount * Math.pow(1 + rate / n, n * years);
        return {
            principal: investmentAmount,
            maturity: Math.round(maturity * 100) / 100,
            interest: Math.round((maturity - investmentAmount) * 100) / 100,
        };
    }, [investmentAmount, investmentResult.weightedRate, loanInputs.termMonths]);

    // Net Savings = Investment Returns - Loan Interest Cost
    const comparison = useMemo(() => {
        const loanInterestSaved = selected.savings;
        const investmentInterest = investmentReturns.interest;
        const loanPenalty = selected.result.totalPenalty || 0;

        // Net savings from the loan strategy
        const netSavings = calculateNetSavings(investmentInterest, scenarioA.totalInterest - selected.result.totalInterest, loanPenalty);

        // Break-even analysis
        const breakEvenMonth = calculateBreakEvenMonth(
            investmentAmount,
            investmentResult.weightedRate,
            scenarioA.totalInterest - selected.result.totalInterest
        );

        return {
            loanInterestSaved,
            investmentReturns: investmentInterest,
            netSavings,
            breakEvenMonth,
            recommendation: loanInterestSaved > investmentInterest ? 'prepay' : 'invest',
        };
    }, [selected, investmentReturns, investmentAmount, investmentResult.weightedRate, scenarioA.totalInterest]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Loan vs Investment</h1>
                <p className="text-gray-600">Should you prepay your loan or invest?</p>
            </div>

            {/* Mode Toggle */}
            <Card>
                <CardHeader title="Investment Mode" subtitle="How should we calculate the investment?" />
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div>
                        <p className="font-medium text-gray-800">
                            {linkedToLoan ? 'Linked to Loan' : 'Independent Amount'}
                        </p>
                        <p className="text-sm text-gray-500">
                            {linkedToLoan
                                ? `Using loan principal: ${formatEUR(loanInputs.principal)}`
                                : `Using investment amount: ${formatEUR(investmentInputs.principal)}`
                            }
                        </p>
                    </div>
                    <Toggle
                        label=""
                        checked={linkedToLoan}
                        onChange={setLinkedToLoan}
                    />
                </div>
            </Card>

            {/* Scenario Selection */}
            <Card>
                <CardHeader title="Select Loan Strategy" subtitle="Compare against Scenario A (Original)" />
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

            {/* Key Metrics */}
            <div className="grid md:grid-cols-3 gap-4">
                <StatCard
                    label="Loan Interest Saved"
                    value={formatEUR(comparison.loanInterestSaved)}
                    subValue={formatINR(convertToINR(comparison.loanInterestSaved))}
                    trend="up"
                />
                <StatCard
                    label="Investment Returns"
                    value={formatEUR(comparison.investmentReturns)}
                    subValue={`At ${formatPercent(investmentResult.weightedRate)}`}
                    trend="up"
                />
                <StatCard
                    label="Net Savings"
                    value={formatEUR(comparison.loanInterestSaved - comparison.investmentReturns)}
                    subValue={comparison.recommendation === 'prepay' ? 'Favor: Prepay' : 'Favor: Invest'}
                    trend={comparison.recommendation === 'prepay' ? 'up' : 'down'}
                />
            </div>

            {/* Break-Even Analysis */}
            {comparison.breakEvenMonth > 0 && (
                <Card>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-2xl">⏱️</span>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-800">Break-Even Point</h3>
                            <p className="text-gray-600">
                                Investment returns exceed loan interest saved in <strong>{comparison.breakEvenMonth} months</strong> ({formatDuration(comparison.breakEvenMonth)})
                            </p>
                        </div>
                    </div>
                </Card>
            )}

            {/* Recommendation */}
            <Card variant={comparison.recommendation === 'prepay' ? 'gradient' : 'default'}>
                <div className="text-center py-4">
                    <div className="text-4xl mb-2">
                        {comparison.recommendation === 'prepay' ? '🏦' : '📈'}
                    </div>
                    <h3 className="text-xl font-bold mb-2">
                        {comparison.recommendation === 'prepay'
                            ? 'Prepaying Saves More!'
                            : 'Investing Gives Better Returns!'
                        }
                    </h3>
                    <p className={comparison.recommendation === 'prepay' ? 'text-white/80' : 'text-gray-600'}>
                        {comparison.recommendation === 'prepay'
                            ? `You save ${formatEUR(comparison.loanInterestSaved - comparison.investmentReturns)} more by prepaying your loan.`
                            : `Investing gives ${formatEUR(comparison.investmentReturns - comparison.loanInterestSaved)} more in returns. However, being debt-free has its own value!`
                        }
                    </p>
                </div>
            </Card>

            {/* Side by Side Comparison */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Loan Details */}
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
                            <span className="text-gray-600">Duration</span>
                            <span className="font-medium">{selected.result.schedule.length} months</span>
                        </div>
                        {selected.result.monthsSaved && selected.result.monthsSaved > 0 && (
                            <div className="flex justify-between text-sm text-green-600">
                                <span>Months Saved</span>
                                <span className="font-medium">{selected.result.monthsSaved}</span>
                            </div>
                        )}
                        <div className="pt-3 border-t">
                            <div className="flex justify-between font-semibold">
                                <span>Interest Saved</span>
                                <span className="text-green-600">{formatEUR(selected.savings)}</span>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Investment Details */}
                <Card>
                    <CardHeader
                        title="Investment Alternative"
                        subtitle={`Portfolio at ${formatPercent(investmentResult.weightedRate)} avg. rate`}
                    />
                    <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Investment Amount</span>
                            <span className="font-medium">{formatEUR(investmentReturns.principal)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Maturity Value</span>
                            <span className="font-medium">{formatEUR(investmentReturns.maturity)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Term</span>
                            <span className="font-medium">{formatDuration(loanInputs.termMonths)}</span>
                        </div>
                        <div className="pt-3 border-t">
                            <div className="flex justify-between font-semibold">
                                <span>Total Returns</span>
                                <span className="text-blue-600">{formatEUR(investmentReturns.interest)}</span>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Visual Comparison */}
            <Card>
                <CardHeader title="Visual Comparison" subtitle="Loan vs Investment" />
                <ComparisonChart
                    scenarios={[
                        {
                            name: 'Loan Interest Saved',
                            totalPayment: selected.savings,
                            totalInterest: selected.savings,
                            color: '#10b981'
                        },
                        {
                            name: 'Investment Returns',
                            totalPayment: investmentReturns.interest,
                            totalInterest: investmentReturns.interest,
                            color: '#3b82f6'
                        },
                    ]}
                />
            </Card>

            {/* Summary */}
            <Card variant="gradient">
                <div className="text-center py-4">
                    <h3 className="text-xl font-bold mb-4">Summary</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/20 rounded-xl p-4">
                            <p className="text-sm text-white/80">Loan Interest Saved</p>
                            <p className="text-2xl font-bold">{formatEUR(comparison.loanInterestSaved)}</p>
                            <p className="text-xs text-white/60">{formatINR(convertToINR(comparison.loanInterestSaved))}</p>
                        </div>
                        <div className="bg-white/20 rounded-xl p-4">
                            <p className="text-sm text-white/80">Investment Returns</p>
                            <p className="text-2xl font-bold">{formatEUR(comparison.investmentReturns)}</p>
                            <p className="text-xs text-white/60">{formatINR(convertToINR(comparison.investmentReturns))}</p>
                        </div>
                    </div>
                    <div className="mt-4 bg-white/10 rounded-xl p-3">
                        <p className="text-sm text-white/80">Net Difference</p>
                        <p className="text-lg font-bold">
                            {comparison.loanInterestSaved > comparison.investmentReturns ? '+' : ''}{formatEUR(comparison.loanInterestSaved - comparison.investmentReturns)}
                        </p>
                    </div>
                </div>
            </Card>

            {/* Sensitivity Analysis */}
            <Card>
                <CardHeader title="Sensitivity Analysis" subtitle="Explore rate scenarios" />
                <div className="space-y-4">
                    {/* Compact Slider Row */}
                    <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                        <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Variation:</span>
                        <input
                            type="range"
                            min={0.25}
                            max={5}
                            step={0.25}
                            value={whatIfAdjustment}
                            onChange={(e) => setWhatIfAdjustment(Number(e.target.value))}
                            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                        <span className="text-sm font-bold text-blue-600 w-12 text-right">±{whatIfAdjustment.toFixed(2)}%</span>
                    </div>

                    {/* Scenario Cards */}
                    <div className="grid md:grid-cols-3 gap-3">
                        {[
                            { label: `Conservative (-${whatIfAdjustment.toFixed(2)}%)`, rateDiff: -whatIfAdjustment },
                            { label: 'Current', rateDiff: 0 },
                            { label: `Optimistic (+${whatIfAdjustment.toFixed(2)}%)`, rateDiff: whatIfAdjustment },
                        ].map((scenario) => {
                            const adjRate = investmentResult.weightedRate + scenario.rateDiff;
                            const adjYears = loanInputs.termMonths / 12;
                            const adjMaturity = investmentAmount * Math.pow(1 + adjRate / 100 / 4, 4 * adjYears);
                            const adjInterest = adjMaturity - investmentAmount;
                            const adjDiff = comparison.loanInterestSaved - adjInterest;
                            const isPositive = adjDiff > 0;

                            return (
                                <div
                                    key={scenario.label}
                                    className={`p-4 rounded-xl border-2 ${scenario.rateDiff === 0
                                        ? 'border-blue-500 bg-blue-50'
                                        : isPositive
                                            ? 'border-green-200 bg-green-50'
                                            : 'border-amber-200 bg-amber-50'
                                        }`}
                                >
                                    <div className="text-xs text-gray-600 mb-1">{scenario.label}</div>
                                    <div className="text-sm font-medium text-gray-800">
                                        Rate: {formatPercent(adjRate)}
                                    </div>
                                    <div className="text-lg font-bold text-gray-900">
                                        {formatEUR(adjInterest)}
                                    </div>
                                    <div className={`text-xs ${isPositive ? 'text-green-600' : 'text-amber-600'}`}>
                                        {isPositive ? 'Prepay wins' : 'Invest wins'} by {formatEUR(Math.abs(adjDiff))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </Card>

            {/* Tips */}
            <div className="space-y-4">
                <Hint type="info">{HINTS.general.savings}</Hint>
                <Hint type="tip">💡 The comparison uses your current portfolio allocation from the Investment Planner. Adjust it there to see different scenarios.</Hint>
            </div>
        </div>
    );
}

