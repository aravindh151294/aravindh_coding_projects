'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardHeader, Button, Input, Select, Toggle, Hint, StatCard, Tabs } from '@/components/ui';
import { AllocationChart } from '@/components/charts';
import { AllocationManager, RiskMeter } from '@/components/investment';
import { useAppState } from '@/context/AppContext';
import { formatEUR, formatINR, formatDuration, formatPercent } from '@/lib/formatters';
import { COMPOUNDING_OPTIONS, HINTS } from '@/lib/constants';
import {
    calculatePortfolioMaturity,
    calculateWeightedAverageRate,
    calculateFDTax,
    adjustForInflation,
    calculateFDMaturity
} from '@/lib/calculations';
import { getInstrumentById, RISK_LABELS } from '@/lib/riskProfiles';

export default function InvestmentPage() {
    const { investment, setInvestment, currency } = useAppState();
    const [showBreakdown, setShowBreakdown] = useState(false);
    const [activeTab, setActiveTab] = useState('allocations');

    const convertToINR = (eur: number) => eur * currency.eurToInr;

    // Calculate portfolio results
    const result = useMemo(() => {
        const portfolioResult = calculatePortfolioMaturity(
            investment.totalAmount,
            investment.allocations,
            investment.termMonths,
            investment.compoundingFrequency
        );

        const taxAmount = investment.includeTax
            ? calculateFDTax(portfolioResult.totalInterest, investment.taxRate)
            : 0;
        const afterTaxInterest = portfolioResult.totalInterest - taxAmount;

        const years = investment.termMonths / 12;
        const inflationAdjusted = investment.adjustInflation
            ? adjustForInflation(portfolioResult.maturityAmount - taxAmount, years, investment.inflationRate)
            : portfolioResult.maturityAmount - taxAmount;

        const effectiveReturn = investment.adjustInflation
            ? portfolioResult.weightedRate - investment.inflationRate
            : portfolioResult.weightedRate;

        // Calculate weighted risk score (0-100)
        const riskScoreMap: Record<string, number> = {
            'very_low': 10, 'low': 25, 'medium': 50, 'medium_high': 70, 'high': 85, 'very_high': 95
        };
        const weightedRisk = investment.allocations.reduce((sum, a) => {
            const inst = getInstrumentById(a.instrumentId);
            return sum + (a.percentage * (inst ? riskScoreMap[inst.riskLevel] : 50));
        }, 0) / 100;

        return {
            ...portfolioResult,
            taxAmount,
            afterTaxInterest,
            inflationAdjusted,
            effectiveReturn,
            weightedRisk,
        };
    }, [investment]);

    // Chart data
    const chartData = result.growthData
        .filter((_, i) => i % 3 === 0 || i === result.growthData.length - 1)
        .map((d, i) => ({
            label: i % 4 === 0 ? `Y${Math.floor(d.month / 12)}` : '',
            value: d.amount,
        }));

    // Allocation breakdown for doughnut
    const allocationData = investment.allocations.map(a => {
        const inst = getInstrumentById(a.instrumentId);
        return { name: inst?.name || a.instrumentId, value: a.amount };
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Investment Planner</h1>
                    <p className="text-gray-600">Multi-instrument portfolio with risk analysis</p>
                </div>
                <Button variant="ghost" onClick={() => setInvestment({
                    allocations: [{ instrumentId: 'fd', amount: 100000, percentage: 100, annualRate: 7 }],
                    totalAmount: 100000,
                })}>
                    Reset
                </Button>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Left Panel - Inputs */}
                <div className="lg:col-span-1 space-y-4">
                    {/* Tabs for mobile-friendly navigation */}
                    <Tabs
                        tabs={[
                            { id: 'allocations', label: 'Portfolio' },
                            { id: 'settings', label: 'Settings' },
                        ]}
                        activeTab={activeTab}
                        onChange={setActiveTab}
                    />

                    {activeTab === 'allocations' && (
                        <>
                            <Card>
                                <CardHeader
                                    title="Portfolio Allocation"
                                    subtitle="Select instruments and allocate funds"
                                />
                                <AllocationManager />
                            </Card>

                            <Card>
                                <CardHeader title="Term" />
                                <Input
                                    label="Investment Duration"
                                    type="number"
                                    suffix="months"
                                    value={investment.termMonths}
                                    onChange={(e) => setInvestment({ termMonths: Number(e.target.value) })}
                                    hint={formatDuration(investment.termMonths)}
                                />
                            </Card>
                        </>
                    )}

                    {activeTab === 'settings' && (
                        <>
                            <Card>
                                <CardHeader title="Compounding & Payout" />
                                <div className="space-y-4">
                                    <Select
                                        label="Compounding Frequency"
                                        options={COMPOUNDING_OPTIONS.map(o => ({ value: o.value, label: o.label }))}
                                        value={investment.compoundingFrequency}
                                        onChange={(e) => setInvestment({
                                            compoundingFrequency: e.target.value as typeof investment.compoundingFrequency
                                        })}
                                    />
                                    <Select
                                        label="Payout Type"
                                        options={[
                                            { value: 'cumulative', label: 'At Maturity (Cumulative)' },
                                            { value: 'monthly', label: 'Monthly Payout' },
                                            { value: 'quarterly', label: 'Quarterly Payout' },
                                            { value: 'yearly', label: 'Yearly Payout' },
                                        ]}
                                        value={investment.payoutType}
                                        onChange={(e) => setInvestment({ payoutType: e.target.value as typeof investment.payoutType })}
                                    />
                                </div>
                            </Card>

                            <Card>
                                <CardHeader title="Adjustments" />
                                <div className="space-y-4">
                                    <Toggle
                                        label="Include Tax Deduction"
                                        checked={investment.includeTax}
                                        onChange={(val) => setInvestment({ includeTax: val })}
                                    />
                                    {investment.includeTax && (
                                        <Input
                                            label="Tax Rate"
                                            type="number"
                                            suffix="%"
                                            value={investment.taxRate}
                                            onChange={(e) => setInvestment({ taxRate: Number(e.target.value) })}
                                        />
                                    )}
                                    <Toggle
                                        label="Adjust for Inflation"
                                        checked={investment.adjustInflation}
                                        onChange={(val) => setInvestment({ adjustInflation: val })}
                                    />
                                    {investment.adjustInflation && (
                                        <Input
                                            label="Inflation Rate"
                                            type="number"
                                            suffix="%"
                                            value={investment.inflationRate}
                                            onChange={(e) => setInvestment({ inflationRate: Number(e.target.value) })}
                                        />
                                    )}
                                </div>
                            </Card>
                        </>
                    )}

                    <Hint type="tip">{HINTS.fd.compounding}</Hint>
                </div>

                {/* Right Panel - Results */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Portfolio Risk Overview */}
                    <Card>
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="font-semibold text-gray-800">Portfolio Risk Level</h3>
                                <p className="text-sm text-gray-500">Weighted average across all instruments</p>
                            </div>
                            <span className="text-2xl font-bold" style={{
                                color: result.weightedRisk < 30 ? '#10b981' : result.weightedRisk < 60 ? '#f59e0b' : '#ef4444'
                            }}>
                                {result.weightedRisk < 30 ? 'Low' : result.weightedRisk < 60 ? 'Medium' : 'High'}
                            </span>
                        </div>
                        <RiskMeter riskScore={result.weightedRisk} size="md" />
                    </Card>

                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard
                            label="Portfolio Value"
                            value={formatEUR(result.maturityAmount)}
                            subValue={formatINR(convertToINR(result.maturityAmount))}
                        />
                        <StatCard
                            label="Total Returns"
                            value={formatEUR(result.totalInterest)}
                            subValue={formatINR(convertToINR(result.totalInterest))}
                            trend="up"
                        />
                        <StatCard
                            label="Weighted Rate"
                            value={formatPercent(result.weightedRate)}
                            subValue={investment.adjustInflation ? `Real: ${formatPercent(result.effectiveReturn)}` : 'Nominal'}
                            trend={result.effectiveReturn > 0 ? 'up' : 'down'}
                        />
                        <StatCard
                            label="After Tax"
                            value={investment.includeTax ? formatEUR(result.afterTaxInterest) : formatEUR(result.totalInterest)}
                            subValue={investment.includeTax ? `Tax: ${formatEUR(result.taxAmount)}` : 'No tax applied'}
                        />
                    </div>

                    {/* Allocation Breakdown - Collapsible */}
                    <Card>
                        <div
                            className="flex items-center justify-between cursor-pointer"
                            onClick={() => setShowBreakdown(!showBreakdown)}
                        >
                            <CardHeader title="Allocation Breakdown" subtitle="Returns per instrument" />
                            <svg
                                className={`w-5 h-5 text-gray-400 transition-transform ${showBreakdown ? 'rotate-180' : ''}`}
                                fill="none" stroke="currentColor" viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                        {showBreakdown && (
                            <div className="mt-4 space-y-3">
                                {investment.allocations.map((a, i) => {
                                    const inst = getInstrumentById(a.instrumentId);
                                    const returnData = result.allocationReturns[i];
                                    return (
                                        <div key={a.instrumentId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div>
                                                <span className="font-medium text-gray-800">{inst?.name}</span>
                                                <span className="text-sm text-gray-500 ml-2">({formatPercent(a.percentage)})</span>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-semibold text-gray-800">{formatEUR(returnData?.amount || 0)}</div>
                                                <div className="text-sm text-green-600">+{formatEUR(returnData?.interest || 0)}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </Card>

                    {/* Asset Allocation Charts */}
                    <Card>
                        <CardHeader title="Asset Allocation" subtitle="Initial vs Projected Distribution" />
                        <div className="grid md:grid-cols-2 gap-8">
                            {/* Initial Allocation */}
                            <div>
                                <h4 className="text-center font-semibold mb-4 text-gray-700">Initial Investment</h4>
                                <AllocationChart
                                    allocations={investment.allocations.map(a => {
                                        const inst = getInstrumentById(a.instrumentId);
                                        return {
                                            name: inst?.name || a.instrumentId,
                                            amount: a.amount,
                                            color: '#3b82f6', // Color handled by component based on index
                                        };
                                    })}
                                    title={formatEUR(investment.totalAmount)}
                                />
                            </div>

                            {/* Projected Allocation */}
                            <div>
                                <h4 className="text-center font-semibold mb-4 text-gray-700">Projected Value</h4>
                                <AllocationChart
                                    allocations={investment.allocations.map(a => {
                                        const inst = getInstrumentById(a.instrumentId);
                                        // Calculate maturity for this specific portion
                                        const maturity = calculateFDMaturity(
                                            a.amount,
                                            a.annualRate,
                                            investment.termMonths,
                                            investment.compoundingFrequency
                                        ).maturityAmount;

                                        return {
                                            name: inst?.name || a.instrumentId,
                                            amount: maturity,
                                            color: '#3b82f6',
                                        };
                                    })}
                                    title={formatEUR(result.maturityAmount)}
                                />
                            </div>
                        </div>
                    </Card>

                    {/* Summary */}
                    <Card variant="gradient">
                        <div className="text-center py-4">
                            <h3 className="text-xl font-bold mb-4">Investment Summary</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/20 rounded-xl p-4">
                                    <p className="text-sm text-white/80">You Invest</p>
                                    <p className="text-2xl font-bold">{formatEUR(investment.totalAmount)}</p>
                                    <p className="text-xs text-white/60">{formatINR(convertToINR(investment.totalAmount))}</p>
                                </div>
                                <div className="bg-white/20 rounded-xl p-4">
                                    <p className="text-sm text-white/80">You Get</p>
                                    <p className="text-2xl font-bold">
                                        {investment.includeTax
                                            ? formatEUR(result.maturityAmount - result.taxAmount)
                                            : formatEUR(result.maturityAmount)
                                        }
                                    </p>
                                    <p className="text-xs text-white/60">
                                        {investment.includeTax
                                            ? formatINR(convertToINR(result.maturityAmount - result.taxAmount))
                                            : formatINR(convertToINR(result.maturityAmount))
                                        }
                                    </p>
                                </div>
                            </div>
                            {investment.adjustInflation && (
                                <div className="mt-4 bg-white/10 rounded-xl p-3">
                                    <p className="text-sm text-white/80">Real Value (Inflation Adjusted)</p>
                                    <p className="text-lg font-bold">{formatEUR(result.inflationAdjusted)}</p>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}

