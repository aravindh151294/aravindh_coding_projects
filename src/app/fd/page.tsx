'use client';

import React, { useState } from 'react';
import { Card, CardHeader, Button, Input, Select, Toggle, Hint, StatCard } from '@/components/ui';
import { LineChart, DoughnutChart } from '@/components/charts';
import { useFDCalculator } from '@/hooks/useFDCalculator';
import { useCurrency } from '@/hooks/useCurrency';
import { formatEUR, formatINR, formatDuration, formatPercent } from '@/lib/formatters';
import { COMPOUNDING_OPTIONS, HINTS } from '@/lib/constants';

export default function FDPage() {
    const { inputs, updateInput, resetInputs, result } = useFDCalculator();
    const { exchangeRate, setExchangeRate, convertToINR } = useCurrency();
    const [showGrowthChart, setShowGrowthChart] = useState(true);

    // Prepare chart data
    const chartData = result.growthData.map((d, i) => ({
        label: i % 12 === 0 ? `Year ${i / 12}` : '',
        value: d.amount,
    })).filter((_, i) => i % 3 === 0 || i === result.growthData.length - 1); // Show every 3 months

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Fixed Deposit Calculator</h1>
                    <p className="text-gray-600">Calculate compound interest and growth</p>
                </div>
                <Button variant="ghost" onClick={resetInputs}>
                    Reset
                </Button>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Input Panel */}
                <div className="lg:col-span-1 space-y-4">
                    <Card>
                        <CardHeader title="FD Details" subtitle="Enter your investment details" />
                        <div className="space-y-4">
                            <Input
                                label="Principal Amount"
                                type="number"
                                prefix="€"
                                value={inputs.principal}
                                onChange={(e) => updateInput('principal', Number(e.target.value))}
                            />
                            <Input
                                label="Annual Interest Rate"
                                type="number"
                                step="0.1"
                                suffix="%"
                                value={inputs.annualRate}
                                onChange={(e) => updateInput('annualRate', Number(e.target.value))}
                            />
                            <Input
                                label="Term"
                                type="number"
                                suffix="months"
                                value={inputs.termMonths}
                                onChange={(e) => updateInput('termMonths', Number(e.target.value))}
                                hint={formatDuration(inputs.termMonths)}
                            />
                            <Select
                                label="Compounding Frequency"
                                options={COMPOUNDING_OPTIONS.map(o => ({ value: o.value, label: o.label }))}
                                value={inputs.compoundingFrequency}
                                onChange={(e) => updateInput('compoundingFrequency', e.target.value as typeof inputs.compoundingFrequency)}
                                hint={HINTS.fd.compounding}
                            />
                        </div>
                    </Card>

                    <Card>
                        <CardHeader title="Adjustments" subtitle="Tax and inflation options" />
                        <div className="space-y-4">
                            <Toggle
                                label="Include Tax Deduction"
                                checked={inputs.includeTax}
                                onChange={(val) => updateInput('includeTax', val)}
                                hint={HINTS.fd.tax}
                            />
                            {inputs.includeTax && (
                                <Input
                                    label="Tax Rate"
                                    type="number"
                                    step="1"
                                    suffix="%"
                                    value={inputs.taxRate}
                                    onChange={(e) => updateInput('taxRate', Number(e.target.value))}
                                />
                            )}
                            <Toggle
                                label="Adjust for Inflation"
                                checked={inputs.adjustInflation}
                                onChange={(val) => updateInput('adjustInflation', val)}
                                hint={HINTS.fd.inflation}
                            />
                            {inputs.adjustInflation && (
                                <Input
                                    label="Inflation Rate"
                                    type="number"
                                    step="0.5"
                                    suffix="%"
                                    value={inputs.inflationRate}
                                    onChange={(e) => updateInput('inflationRate', Number(e.target.value))}
                                />
                            )}
                        </div>
                    </Card>

                    <Card>
                        <CardHeader title="Currency" subtitle="EUR to INR conversion" />
                        <Input
                            label="Exchange Rate"
                            type="number"
                            step="0.1"
                            prefix="₹"
                            suffix="per €"
                            value={exchangeRate}
                            onChange={(e) => setExchangeRate(Number(e.target.value))}
                        />
                    </Card>
                </div>

                {/* Results Panel */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard
                            label="Maturity Amount"
                            value={formatEUR(result.maturityAmount)}
                            subValue={formatINR(convertToINR(result.maturityAmount))}
                        />
                        <StatCard
                            label="Total Interest"
                            value={formatEUR(result.totalInterest)}
                            subValue={formatINR(convertToINR(result.totalInterest))}
                            trend="up"
                        />
                        <StatCard
                            label="Effective Return"
                            value={formatPercent(result.effectiveReturn)}
                            subValue={inputs.adjustInflation ? 'After inflation' : 'Nominal rate'}
                            trend={result.effectiveReturn > 0 ? 'up' : 'down'}
                        />
                        <StatCard
                            label="After Tax Interest"
                            value={inputs.includeTax ? formatEUR(result.afterTaxInterest) : formatEUR(result.totalInterest)}
                            subValue={inputs.includeTax ? `Tax: ${formatEUR(result.taxAmount)}` : 'Tax not applied'}
                        />
                    </div>

                    {/* Inflation Adjusted Warning */}
                    {inputs.adjustInflation && result.effectiveReturn < 2 && (
                        <Hint type="warning">
                            📉 Your real return ({formatPercent(result.effectiveReturn)}) is very low after accounting for {formatPercent(inputs.inflationRate)} inflation. Consider higher-yield investments.
                        </Hint>
                    )}

                    {/* Payment Breakdown */}
                    <Card>
                        <CardHeader title="Investment Breakdown" subtitle="Principal vs Interest earned" />
                        <div className="max-w-xs mx-auto">
                            <DoughnutChart
                                principal={inputs.principal}
                                interest={result.totalInterest}
                                title="Investment Split"
                            />
                        </div>
                    </Card>

                    {/* Growth Chart Toggle */}
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-800">Growth Visualization</h3>
                        <Toggle
                            label="Show Chart"
                            checked={showGrowthChart}
                            onChange={setShowGrowthChart}
                        />
                    </div>

                    {/* Growth Chart */}
                    {showGrowthChart && (
                        <Card>
                            <CardHeader title="FD Growth Over Time" subtitle="How your investment grows" />
                            <LineChart
                                data={chartData}
                                title="Amount (€)"
                                color="#10b981"
                                fillGradient
                            />
                        </Card>
                    )}

                    {/* Summary Card */}
                    <Card variant="gradient">
                        <div className="text-center py-4">
                            <h3 className="text-xl font-bold mb-4">Investment Summary</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/20 rounded-xl p-4">
                                    <p className="text-sm text-white/80">You Invest</p>
                                    <p className="text-2xl font-bold">{formatEUR(inputs.principal)}</p>
                                    <p className="text-xs text-white/60">{formatINR(convertToINR(inputs.principal))}</p>
                                </div>
                                <div className="bg-white/20 rounded-xl p-4">
                                    <p className="text-sm text-white/80">You Get</p>
                                    <p className="text-2xl font-bold">
                                        {inputs.includeTax
                                            ? formatEUR(result.maturityAmount - result.taxAmount)
                                            : formatEUR(result.maturityAmount)
                                        }
                                    </p>
                                    <p className="text-xs text-white/60">
                                        {inputs.includeTax
                                            ? formatINR(convertToINR(result.maturityAmount - result.taxAmount))
                                            : formatINR(convertToINR(result.maturityAmount))
                                        }
                                    </p>
                                </div>
                            </div>
                            {inputs.adjustInflation && (
                                <div className="mt-4 bg-white/10 rounded-xl p-3">
                                    <p className="text-sm text-white/80">Real Value (Inflation Adjusted)</p>
                                    <p className="text-lg font-bold">{formatEUR(result.inflationAdjustedAmount)}</p>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Growth Table */}
                    <Card padding="sm">
                        <CardHeader title="Yearly Growth" subtitle="Amount at end of each year" />
                        <div className="overflow-x-auto">
                            <table className="schedule-table">
                                <thead>
                                    <tr>
                                        <th>Year</th>
                                        <th>Amount (€)</th>
                                        <th>Amount (₹)</th>
                                        <th>Interest Earned (€)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {result.growthData
                                        .filter((_, i) => i > 0 && i % 12 === 0)
                                        .map((d, i) => (
                                            <tr key={d.month}>
                                                <td className="font-medium">Year {i + 1}</td>
                                                <td>{formatEUR(d.amount)}</td>
                                                <td className="text-gray-500">{formatINR(convertToINR(d.amount))}</td>
                                                <td className="text-green-600">{formatEUR(d.amount - inputs.principal)}</td>
                                            </tr>
                                        ))}
                                    {/* Final row for maturity */}
                                    <tr className="bg-blue-50">
                                        <td className="font-bold">Maturity</td>
                                        <td className="font-bold">{formatEUR(result.maturityAmount)}</td>
                                        <td className="text-gray-500">{formatINR(convertToINR(result.maturityAmount))}</td>
                                        <td className="text-green-600 font-bold">{formatEUR(result.totalInterest)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    <Hint type="tip">{HINTS.fd.comparison}</Hint>
                </div>
            </div>
        </div>
    );
}
