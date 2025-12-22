'use client';

import React, { useMemo } from 'react';
import { Card, CardHeader, Hint, StatCard, Badge } from '@/components/ui';
import { useLoanCalculator } from '@/hooks/useLoanCalculator';
import { useAppState } from '@/context/AppContext';
import { useFormatters, formatDuration } from '@/hooks/useFormatters';
import {
    calculatePortfolioMaturity,
    calculateWeightedAverageRate,
    calculateSIPPortfolioMaturity,
    generateLumpsumVsSIPComparison,
    calculateScenarioA,
    calculateScenarioB,
    calculateScenarioC,
} from '@/lib/calculations';

export default function ComparePage() {
    const { investment, loan, currency } = useAppState();
    const { formatEUR, formatINR, formatPercent } = useFormatters();

    const convertToINR = (eur: number) => eur * currency.eurToInr;

    // Calculate Lumpsum results
    const lumpsumResult = useMemo(() => {
        const totalAmount = investment.lumpsum.linkedToLoan
            ? loan.principal
            : investment.lumpsum.totalAmount;

        const allocationsWithAmount = investment.lumpsum.allocations.map(a => ({
            ...a,
            amount: (a.percentage / 100) * totalAmount,
        }));

        const result = calculatePortfolioMaturity(
            totalAmount,
            allocationsWithAmount,
            investment.termMonths,
            investment.compoundingFrequency
        );

        // Apply taxes per allocation
        let totalTaxPaid = 0;
        const afterTaxInterest = allocationsWithAmount.reduce((sum, a, i) => {
            const allocationInterest = result.allocationReturns[i]?.interest || 0;
            const tax = allocationInterest * (a.taxRate / 100);
            totalTaxPaid += tax;
            return sum + (allocationInterest - tax);
        }, 0);

        return {
            ...result,
            totalAmount,
            totalTaxPaid,
            afterTaxInterest,
            netMaturity: totalAmount + afterTaxInterest,
        };
    }, [investment.lumpsum, investment.termMonths, investment.compoundingFrequency, loan.principal]);

    // Calculate SIP results
    const sipResult = useMemo(() => {
        const allocationsWithTax = investment.sip.allocations.map(a => ({
            instrumentId: a.instrumentId,
            amount: (a.percentage / 100) * investment.sip.monthlyAmount,
            percentage: a.percentage,
            annualRate: a.annualRate,
            taxRate: a.taxRate,
        }));

        return calculateSIPPortfolioMaturity(
            investment.sip.monthlyAmount,
            allocationsWithTax,
            investment.termMonths,
            true
        );
    }, [investment.sip, investment.termMonths]);

    // Loan Scenarios
    const { scenarioA, scenarioB, scenarioC, savings } = useLoanCalculator();

    // Lumpsum vs SIP comparison data for chart
    const comparisonData = useMemo(() => {
        return generateLumpsumVsSIPComparison(
            lumpsumResult.totalAmount,
            lumpsumResult.weightedRate,
            investment.sip.monthlyAmount,
            sipResult.weightedRate,
            investment.termMonths
        );
    }, [lumpsumResult, sipResult, investment.sip.monthlyAmount, investment.termMonths]);

    // Determine winner
    const winner = lumpsumResult.netMaturity >= sipResult.maturityAmount ? 'lumpsum' : 'sip';
    const difference = Math.abs(lumpsumResult.netMaturity - sipResult.maturityAmount);

    // Calculate loan + lumpsum vs pure SIP (for linked mode)
    const linkedComparison = useMemo(() => {
        if (!investment.lumpsum.linkedToLoan) return null;

        const loanInterestPaid = scenarioA.totalInterest;
        const lumpsumGain = lumpsumResult.afterTaxInterest;
        const netFromLumpsum = lumpsumGain - loanInterestPaid;

        const sipGain = sipResult.totalGain;
        const sipInvested = sipResult.totalInvested;

        return {
            strategy1: {
                name: 'Take Loan + Invest Lumpsum',
                loanCost: loanInterestPaid,
                investmentGain: lumpsumGain,
                net: netFromLumpsum,
            },
            strategy2: {
                name: 'Pure SIP',
                invested: sipInvested,
                gain: sipGain,
                total: sipResult.maturityAmount,
            },
            winner: netFromLumpsum > sipGain ? 'strategy1' : 'strategy2',
            difference: Math.abs(netFromLumpsum - sipGain),
        };
    }, [investment.lumpsum.linkedToLoan, scenarioA, lumpsumResult, sipResult]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 pb-24 md:pb-8">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Investment Comparison</h1>
                    <p className="text-gray-600 text-sm">
                        {investment.lumpsum.linkedToLoan
                            ? 'Loan + Lumpsum vs Pure SIP Analysis'
                            : 'Lumpsum vs SIP Comparison'
                        }
                    </p>
                </div>

                {/* Mode Indicator */}
                {investment.lumpsum.linkedToLoan && (
                    <Hint type="info">
                        🔗 **Linked to Loan Mode**: Comparing if you should take a €{formatEUR(loan.principal)} loan and invest lumpsum, or just do monthly SIP.
                    </Hint>
                )}

                {/* Side-by-side Comparison */}
                <div className="grid md:grid-cols-2 gap-4">
                    {/* Lumpsum Card */}
                    <Card className={`${winner === 'lumpsum' ? 'ring-2 ring-blue-500' : ''}`}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-blue-800">Lumpsum</h3>
                            {winner === 'lumpsum' && (
                                <Badge variant="default">🏆 Winner</Badge>
                            )}
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Invested</span>
                                <span className="font-semibold">{formatEUR(lumpsumResult.totalAmount)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Returns (after tax)</span>
                                <span className="font-semibold text-green-600">+{formatEUR(lumpsumResult.afterTaxInterest)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Weighted CAGR</span>
                                <span className="font-semibold">{formatPercent(lumpsumResult.weightedRate)}</span>
                            </div>
                            <div className="pt-3 border-t">
                                <div className="flex justify-between">
                                    <span className="text-gray-800 font-medium">Maturity Value</span>
                                    <span className="text-xl font-bold text-blue-600">{formatEUR(lumpsumResult.netMaturity)}</span>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* SIP Card */}
                    <Card className={`${winner === 'sip' ? 'ring-2 ring-green-500' : ''}`}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-green-800">SIP</h3>
                            {winner === 'sip' && (
                                <Badge variant="success">🏆 Winner</Badge>
                            )}
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Monthly</span>
                                <span className="font-semibold">{formatEUR(investment.sip.monthlyAmount)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Total Invested</span>
                                <span className="font-semibold">{formatEUR(sipResult.totalInvested)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Gain (after tax)</span>
                                <span className="font-semibold text-green-600">+{formatEUR(sipResult.totalGain)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Weighted XIRR</span>
                                <span className="font-semibold">{formatPercent(sipResult.weightedRate)}</span>
                            </div>
                            <div className="pt-3 border-t">
                                <div className="flex justify-between">
                                    <span className="text-gray-800 font-medium">Maturity Value</span>
                                    <span className="text-xl font-bold text-green-600">{formatEUR(sipResult.maturityAmount)}</span>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Net Difference */}
                <Card className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
                    <div className="text-center">
                        <p className="text-white/80 text-sm">Net Difference</p>
                        <p className="text-3xl font-bold">
                            {winner === 'lumpsum' ? 'Lumpsum' : 'SIP'} is ahead by {formatEUR(difference)}
                        </p>
                        <p className="text-sm text-white/70 mt-1">
                            Over {formatDuration(investment.termMonths)}
                        </p>
                    </div>
                </Card>

                {/* Break-even Timeline */}
                <Card>
                    <CardHeader title="Break-even Timeline" subtitle="When SIP catches up to Lumpsum" />
                    <div className="space-y-4">
                        {comparisonData.breakEvenMonth > 0 ? (
                            <div className="p-4 bg-yellow-50 rounded-xl">
                                <p className="text-yellow-800">
                                    📊 SIP catches up to Lumpsum at <strong>month {comparisonData.breakEvenMonth}</strong> ({formatDuration(comparisonData.breakEvenMonth)})
                                </p>
                            </div>
                        ) : (
                            <div className="p-4 bg-blue-50 rounded-xl">
                                <p className="text-blue-800">
                                    📈 Lumpsum stays ahead throughout the {formatDuration(investment.termMonths)} period
                                </p>
                            </div>
                        )}

                        {/* Timeline visualization */}
                        {/* Simple visual representation */}
                        <div className="grid grid-cols-2 gap-4">
                            {comparisonData.data.filter((_, i) => i % 12 === 0 || i === comparisonData.data.length - 1).map((d) => (
                                <div key={d.month} className="text-center p-2 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-500">Year {Math.floor(d.month / 12)}</p>
                                    <p className="text-sm text-blue-600">L: {formatEUR(d.lumpsum)}</p>
                                    <p className="text-sm text-green-600">S: {formatEUR(d.sip)}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>

                {/* Linked Mode: Loan Strategy Comparison */}
                {linkedComparison && (
                    <Card>
                        <CardHeader title="Loan Strategy Analysis" subtitle="Should you take a loan and invest, or just SIP?" />
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className={`p-4 rounded-xl ${linkedComparison.winner === 'strategy1' ? 'bg-blue-100 ring-2 ring-blue-500' : 'bg-gray-50'}`}>
                                <h4 className="font-semibold text-gray-800 mb-2">
                                    {linkedComparison.strategy1.name}
                                    {linkedComparison.winner === 'strategy1' && ' 🏆'}
                                </h4>
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                        <span>Loan Interest Paid</span>
                                        <span className="text-red-600">-{formatEUR(linkedComparison.strategy1.loanCost)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Investment Gain</span>
                                        <span className="text-green-600">+{formatEUR(linkedComparison.strategy1.investmentGain)}</span>
                                    </div>
                                    <div className="flex justify-between font-bold pt-2 border-t mt-2">
                                        <span>Net Benefit</span>
                                        <span className={linkedComparison.strategy1.net >= 0 ? 'text-green-600' : 'text-red-600'}>
                                            {linkedComparison.strategy1.net >= 0 ? '+' : ''}{formatEUR(linkedComparison.strategy1.net)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className={`p-4 rounded-xl ${linkedComparison.winner === 'strategy2' ? 'bg-green-100 ring-2 ring-green-500' : 'bg-gray-50'}`}>
                                <h4 className="font-semibold text-gray-800 mb-2">
                                    {linkedComparison.strategy2.name}
                                    {linkedComparison.winner === 'strategy2' && ' 🏆'}
                                </h4>
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                        <span>Total Invested</span>
                                        <span>{formatEUR(linkedComparison.strategy2.invested)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Total Gain</span>
                                        <span className="text-green-600">+{formatEUR(linkedComparison.strategy2.gain)}</span>
                                    </div>
                                    <div className="flex justify-between font-bold pt-2 border-t mt-2">
                                        <span>Final Value</span>
                                        <span className="text-green-600">{formatEUR(linkedComparison.strategy2.total)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <Hint type="tip" className="mt-4">
                            💡 This compares: (1) Taking a loan, paying interest, and investing the principal as lumpsum vs (2) Just doing monthly SIP without any loan.
                        </Hint>
                    </Card>
                )}

                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard
                        label="Investment Duration"
                        value={formatDuration(investment.termMonths)}
                    />
                    <StatCard
                        label="Lumpsum Amount"
                        value={formatEUR(lumpsumResult.totalAmount)}
                    />
                    <StatCard
                        label="SIP Monthly"
                        value={formatEUR(investment.sip.monthlyAmount)}
                    />
                    <StatCard
                        label="Break-even"
                        value={comparisonData.breakEvenMonth > 0 ? `Month ${comparisonData.breakEvenMonth}` : 'Never'}
                    />
                </div>
            </div>
        </div>
    );
}
