'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardHeader, Hint, StatCard, Badge } from '@/components/ui';
import { useLoanCalculator } from '@/hooks/useLoanCalculator';
import { useAppState } from '@/context/AppContext';
import { useFormatters, formatDuration } from '@/hooks/useFormatters';
import {
    calculatePortfolioMaturity,
    calculateSIPPortfolioMaturity,
    generateLumpsumVsSIPComparison,
} from '@/lib/calculations';

export default function ComparePage() {
    const { investment, loan, currency } = useAppState();
    const { formatEUR, formatPercent } = useFormatters();
    const [whatIfAdjustment, setWhatIfAdjustment] = useState(2);
    const [loanScenario, setLoanScenario] = useState<'A' | 'B' | 'C'>('A');

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

    // Loan interest calculation
    const { scenarioA, scenarioB, scenarioC } = useLoanCalculator();

    const loanInterest = useMemo(() => {
        switch (loanScenario) {
            case 'B': return scenarioB.totalInterest;
            case 'C': return scenarioC.totalInterest;
            default: return scenarioA.totalInterest;
        }
    }, [loanScenario, scenarioA, scenarioB, scenarioC]);

    // Break-even comparison data
    const comparisonData = useMemo(() => {
        return generateLumpsumVsSIPComparison(
            lumpsumResult.totalAmount,
            lumpsumResult.weightedRate,
            investment.sip.monthlyAmount,
            sipResult.weightedRate,
            investment.termMonths
        );
    }, [lumpsumResult, sipResult, investment.sip.monthlyAmount, investment.termMonths]);

    // === CORE COMPARISON LOGIC ===
    // Linked Mode: Compare SIP gains vs (Lumpsum gains - Loan Interest)
    // Independent Mode: Compare SIP gains vs Lumpsum gains
    const linkedNetGain = investment.lumpsum.linkedToLoan
        ? lumpsumResult.afterTaxInterest - loanInterest
        : lumpsumResult.afterTaxInterest;

    const sipGain = sipResult.totalGain;
    const winner = linkedNetGain >= sipGain ? 'lumpsum' : 'sip';
    const difference = Math.abs(linkedNetGain - sipGain);

    // What-If Scenarios
    const whatIfScenarios = useMemo(() => {
        const baseRateLumpsum = lumpsumResult.weightedRate;
        const baseRateSIP = sipResult.weightedRate;

        // Lower scenario
        const lowerLumpsum = (() => {
            const totalAmount = investment.lumpsum.linkedToLoan ? loan.principal : investment.lumpsum.totalAmount;
            const allocationsWithAmount = investment.lumpsum.allocations.map(a => ({
                ...a,
                amount: (a.percentage / 100) * totalAmount,
                annualRate: a.annualRate - whatIfAdjustment,
            }));
            const result = calculatePortfolioMaturity(totalAmount, allocationsWithAmount, investment.termMonths, investment.compoundingFrequency);
            let taxPaid = 0;
            const gain = allocationsWithAmount.reduce((sum, a, i) => {
                const interest = result.allocationReturns[i]?.interest || 0;
                taxPaid += interest * (a.taxRate / 100);
                return sum + interest * (1 - a.taxRate / 100);
            }, 0);
            return investment.lumpsum.linkedToLoan ? gain - loanInterest : gain;
        })();

        const lowerSIP = (() => {
            const allocations = investment.sip.allocations.map(a => ({
                ...a,
                annualRate: a.annualRate - whatIfAdjustment,
            }));
            const result = calculateSIPPortfolioMaturity(investment.sip.monthlyAmount, allocations, investment.termMonths, true);
            return result.totalGain;
        })();

        // Higher scenario
        const higherLumpsum = (() => {
            const totalAmount = investment.lumpsum.linkedToLoan ? loan.principal : investment.lumpsum.totalAmount;
            const allocationsWithAmount = investment.lumpsum.allocations.map(a => ({
                ...a,
                amount: (a.percentage / 100) * totalAmount,
                annualRate: a.annualRate + whatIfAdjustment,
            }));
            const result = calculatePortfolioMaturity(totalAmount, allocationsWithAmount, investment.termMonths, investment.compoundingFrequency);
            let taxPaid = 0;
            const gain = allocationsWithAmount.reduce((sum, a, i) => {
                const interest = result.allocationReturns[i]?.interest || 0;
                taxPaid += interest * (a.taxRate / 100);
                return sum + interest * (1 - a.taxRate / 100);
            }, 0);
            return investment.lumpsum.linkedToLoan ? gain - loanInterest : gain;
        })();

        const higherSIP = (() => {
            const allocations = investment.sip.allocations.map(a => ({
                ...a,
                annualRate: a.annualRate + whatIfAdjustment,
            }));
            const result = calculateSIPPortfolioMaturity(investment.sip.monthlyAmount, allocations, investment.termMonths, true);
            return result.totalGain;
        })();

        return {
            lower: { lumpsum: lowerLumpsum, sip: lowerSIP },
            current: { lumpsum: linkedNetGain, sip: sipGain },
            higher: { lumpsum: higherLumpsum, sip: higherSIP },
        };
    }, [whatIfAdjustment, investment, loan, lumpsumResult, sipResult, loanInterest, linkedNetGain, sipGain]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 pb-24 md:pb-8">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Investment Comparison</h1>
                    <p className="text-gray-600 text-sm">
                        {investment.lumpsum.linkedToLoan
                            ? 'Loan + Lumpsum vs Pure SIP (Net Gains)'
                            : 'Lumpsum vs SIP (Net Gains)'
                        }
                    </p>
                </div>

                {/* Mode Indicator */}
                {investment.lumpsum.linkedToLoan && (
                    <div className="space-y-4 mb-6">
                        <Hint type="info">
                            🔗 **Linked Mode**: Lumpsum gain is reduced by loan interest ({formatEUR(loanInterest)}) for fair comparison.
                        </Hint>

                        <div className="flex items-center justify-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <span className="text-sm font-medium text-gray-700">Loan Repayment Strategy:</span>
                            <div className="flex gap-2">
                                {[
                                    { id: 'A', label: 'Regular' },
                                    { id: 'B', label: 'Lumpsum Prepay' },
                                    { id: 'C', label: 'Extra EMI' },
                                ].map((opt) => (
                                    <button
                                        key={opt.id}
                                        onClick={() => setLoanScenario(opt.id as 'A' | 'B' | 'C')}
                                        className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${loanScenario === opt.id
                                                ? 'bg-blue-600 text-white'
                                                : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Duration Lock Info */}
                <Hint type="tip">
                    ℹ️ Duration locked at **{formatDuration(investment.termMonths)}** for both strategies. Change it in the Invest page.
                </Hint>

                {/* Net Gains Comparison */}
                <div className="grid md:grid-cols-2 gap-4">
                    {/* Lumpsum Card */}
                    <Card className={`${winner === 'lumpsum' ? 'ring-2 ring-blue-500' : ''}`}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-blue-800">
                                {investment.lumpsum.linkedToLoan ? 'Loan + Lumpsum' : 'Lumpsum'}
                            </h3>
                            {winner === 'lumpsum' && (
                                <Badge variant="default">🏆 Better</Badge>
                            )}
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Lumpsum Gain</span>
                                <span className="font-semibold text-green-600">+{formatEUR(lumpsumResult.afterTaxInterest)}</span>
                            </div>
                            {investment.lumpsum.linkedToLoan && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Loan Interest</span>
                                    <span className="font-semibold text-red-600">-{formatEUR(loanInterest)}</span>
                                </div>
                            )}
                            <div className="pt-3 border-t">
                                <div className="flex justify-between">
                                    <span className="text-gray-800 font-medium">Net Savings</span>
                                    <span className={`text-xl font-bold ${linkedNetGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {linkedNetGain >= 0 ? '+' : ''}{formatEUR(linkedNetGain)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* SIP Card */}
                    <Card className={`${winner === 'sip' ? 'ring-2 ring-green-500' : ''}`}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-green-800">SIP</h3>
                            {winner === 'sip' && (
                                <Badge variant="success">🏆 Better</Badge>
                            )}
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Monthly SIP</span>
                                <span className="font-semibold">{formatEUR(investment.sip.monthlyAmount)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Total Invested</span>
                                <span className="font-semibold">{formatEUR(sipResult.totalInvested)}</span>
                            </div>
                            <div className="pt-3 border-t">
                                <div className="flex justify-between">
                                    <span className="text-gray-800 font-medium">Net Gain</span>
                                    <span className="text-xl font-bold text-green-600">+{formatEUR(sipGain)}</span>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Winner Summary */}
                <Card className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
                    <div className="text-center">
                        <p className="text-white/80 text-sm">Winner</p>
                        <p className="text-3xl font-bold">
                            {winner === 'lumpsum'
                                ? (investment.lumpsum.linkedToLoan ? 'Loan + Lumpsum' : 'Lumpsum')
                                : 'SIP'
                            } wins by {formatEUR(difference)}
                        </p>
                        <p className="text-sm text-white/70 mt-1">
                            Over {formatDuration(investment.termMonths)}
                        </p>
                    </div>
                </Card>

                {/* Break-even Timeline */}
                <Card>
                    <CardHeader title="Break-even Timeline" subtitle="When SIP catches up to Lumpsum in absolute value" />
                    <div className="space-y-4">
                        {comparisonData.breakEvenMonth > 0 ? (
                            <div className="p-4 bg-yellow-50 rounded-xl">
                                <p className="text-yellow-800">
                                    📊 SIP value equals Lumpsum at <strong>month {comparisonData.breakEvenMonth}</strong> ({formatDuration(comparisonData.breakEvenMonth)})
                                </p>
                            </div>
                        ) : (
                            <div className="p-4 bg-blue-50 rounded-xl">
                                <p className="text-blue-800">
                                    📈 Lumpsum stays ahead throughout the {formatDuration(investment.termMonths)} period
                                </p>
                            </div>
                        )}

                        {/* Value Progression */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                            {comparisonData.data.filter((_, i) => i % 12 === 0 || i === comparisonData.data.length - 1).map((d) => (
                                <div key={d.month} className="text-center p-2 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-500">Yr {Math.floor(d.month / 12)}</p>
                                    <p className="text-sm text-blue-600 font-medium">{formatEUR(d.lumpsum)}</p>
                                    <p className="text-sm text-green-600 font-medium">{formatEUR(d.sip)}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>

                {/* What-If Sensitivity Analysis */}
                <Card>
                    <CardHeader title="What-If Analysis" subtitle="How rate changes affect your gains" />

                    {/* Slider */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">Rate adjustment:</span>
                            <span className="text-sm font-bold text-purple-600">±{whatIfAdjustment}%</span>
                        </div>
                        <div className="relative h-4 flex items-center">
                            {/* Gradient background */}
                            <div
                                className="absolute w-full h-2 rounded-full"
                                style={{
                                    background: 'linear-gradient(to right, #22c55e, #84cc16, #facc15, #f97316, #ef4444)'
                                }}
                            />
                            <input
                                type="range"
                                min={0.25}
                                max={5}
                                step={0.25}
                                value={whatIfAdjustment}
                                onChange={(e) => setWhatIfAdjustment(Number(e.target.value))}
                                className="relative w-full h-4 bg-transparent rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-purple-500 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-purple-500"
                            />
                        </div>
                        <div className="flex justify-between text-xs mt-2">
                            <span className="text-green-600 font-medium">0.25%</span>
                            <span className="text-red-600 font-medium">5%</span>
                        </div>
                    </div>

                    {/* Scenarios Grid */}
                    <div className="grid grid-cols-3 gap-4">
                        {/* Lower Scenario */}
                        <div className="p-4 bg-red-50 rounded-xl text-center">
                            <p className="text-xs text-red-600 font-medium mb-2">-{whatIfAdjustment}% Rate</p>
                            <div className="space-y-2">
                                <div>
                                    <p className="text-xs text-gray-500">Lumpsum Net</p>
                                    <p className={`text-sm font-bold ${whatIfScenarios.lower.lumpsum >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {whatIfScenarios.lower.lumpsum >= 0 ? '+' : ''}{formatEUR(whatIfScenarios.lower.lumpsum)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">SIP Gain</p>
                                    <p className="text-sm font-bold text-green-600">+{formatEUR(whatIfScenarios.lower.sip)}</p>
                                </div>
                                <Badge variant={whatIfScenarios.lower.lumpsum >= whatIfScenarios.lower.sip ? 'default' : 'success'}>
                                    {whatIfScenarios.lower.lumpsum >= whatIfScenarios.lower.sip ? 'Lumpsum' : 'SIP'}
                                </Badge>
                            </div>
                        </div>

                        {/* Current */}
                        <div className="p-4 bg-purple-50 rounded-xl text-center ring-2 ring-purple-400">
                            <p className="text-xs text-purple-600 font-medium mb-2">Current</p>
                            <div className="space-y-2">
                                <div>
                                    <p className="text-xs text-gray-500">Lumpsum Net</p>
                                    <p className={`text-sm font-bold ${whatIfScenarios.current.lumpsum >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {whatIfScenarios.current.lumpsum >= 0 ? '+' : ''}{formatEUR(whatIfScenarios.current.lumpsum)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">SIP Gain</p>
                                    <p className="text-sm font-bold text-green-600">+{formatEUR(whatIfScenarios.current.sip)}</p>
                                </div>
                                <Badge variant={winner === 'lumpsum' ? 'default' : 'success'}>
                                    🏆 {winner === 'lumpsum' ? 'Lumpsum' : 'SIP'}
                                </Badge>
                            </div>
                        </div>

                        {/* Higher Scenario */}
                        <div className="p-4 bg-green-50 rounded-xl text-center">
                            <p className="text-xs text-green-600 font-medium mb-2">+{whatIfAdjustment}% Rate</p>
                            <div className="space-y-2">
                                <div>
                                    <p className="text-xs text-gray-500">Lumpsum Net</p>
                                    <p className={`text-sm font-bold ${whatIfScenarios.higher.lumpsum >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {whatIfScenarios.higher.lumpsum >= 0 ? '+' : ''}{formatEUR(whatIfScenarios.higher.lumpsum)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">SIP Gain</p>
                                    <p className="text-sm font-bold text-green-600">+{formatEUR(whatIfScenarios.higher.sip)}</p>
                                </div>
                                <Badge variant={whatIfScenarios.higher.lumpsum >= whatIfScenarios.higher.sip ? 'default' : 'success'}>
                                    {whatIfScenarios.higher.lumpsum >= whatIfScenarios.higher.sip ? 'Lumpsum' : 'SIP'}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard
                        label="Duration"
                        value={formatDuration(investment.termMonths)}
                    />
                    <StatCard
                        label="Lumpsum Capital"
                        value={formatEUR(lumpsumResult.totalAmount)}
                    />
                    <StatCard
                        label="SIP Monthly"
                        value={formatEUR(investment.sip.monthlyAmount)}
                    />
                    <StatCard
                        label="Difference"
                        value={formatEUR(difference)}
                        subValue={winner === 'lumpsum' ? 'Lumpsum ahead' : 'SIP ahead'}
                    />
                </div>
            </div>
        </div>
    );
}
