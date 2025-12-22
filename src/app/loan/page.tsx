'use client';

import React, { useState } from 'react';
import { Card, CardHeader, Button, Input, Select, Toggle, Hint, StatCard, Tabs, Badge } from '@/components/ui';
import { ComparisonChart, DoughnutChart } from '@/components/charts';
import { useLoanCalculator } from '@/hooks/useLoanCalculator';
import { useCurrency } from '@/hooks/useCurrency';
import { formatEUR, formatINR, formatNumber, formatDuration, formatPercent } from '@/lib/formatters';
import { EXTRA_PAYMENT_OPTIONS, HINTS } from '@/lib/constants';
import { MonthlyScheduleEntry } from '@/lib/calculations';

export default function LoanPage() {
  const { inputs, updateInput, resetInputs, scenarioA, scenarioB, scenarioC, savings, exchangeRate } = useLoanCalculator();
  const { convertToINR } = useCurrency();
  const [activeScenario, setActiveScenario] = useState('A');
  const [showSchedule, setShowSchedule] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  const scenarios = [
    { id: 'A', label: 'Scenario A', result: scenarioA },
    { id: 'B', label: 'Scenario B', result: scenarioB },
    { id: 'C', label: 'Scenario C', result: scenarioC },
  ];

  const activeResult = scenarios.find(s => s.id === activeScenario)?.result || scenarioA;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Loan Calculator</h1>
          <p className="text-gray-600">Compare 3 repayment strategies</p>
        </div>
        <Button variant="ghost" onClick={resetInputs}>
          Reset
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Input Panel */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader title="Loan Details" subtitle="Enter your loan information" />
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
                label="Loan Term"
                type="number"
                suffix="months"
                value={inputs.termMonths}
                onChange={(e) => updateInput('termMonths', Number(e.target.value))}
                hint={formatDuration(inputs.termMonths)}
              />
            </div>
          </Card>

          <Card>
            <CardHeader title="Prepayment (Scenario B)" subtitle="Lump-sum payment options" />
            <div className="space-y-4">
              <Input
                label="Prepayment Amount"
                type="number"
                prefix="€"
                value={inputs.prepaymentAmount}
                onChange={(e) => updateInput('prepaymentAmount', Number(e.target.value))}
              />
              <Input
                label="Prepayment Month"
                type="number"
                suffix="month"
                value={inputs.prepaymentMonth}
                onChange={(e) => updateInput('prepaymentMonth', Number(e.target.value))}
                hint="When to make the lump-sum payment"
              />
              <Input
                label="Penalty Rate"
                type="number"
                step="0.1"
                suffix="%"
                value={inputs.penaltyRate}
                onChange={(e) => updateInput('penaltyRate', Number(e.target.value))}
                hint="Prepayment penalty (default: 1%)"
              />
            </div>
          </Card>

          <Card>
            <CardHeader title="Extra Monthly Payment" subtitle="For Scenarios B & C" />
            <div className="space-y-4">
              <Input
                label="Extra Monthly Amount"
                type="number"
                prefix="€"
                value={inputs.extraMonthlyPayment}
                onChange={(e) => updateInput('extraMonthlyPayment', Number(e.target.value))}
              />
              <Select
                label="Apply Extra Payment"
                options={EXTRA_PAYMENT_OPTIONS.map(o => ({ value: o.value, label: o.label }))}
                value={inputs.extraPaymentTiming}
                onChange={(e) => updateInput('extraPaymentTiming', e.target.value as 'before' | 'after' | 'both')}
                hint="When to apply extra payments in Scenario B"
              />
            </div>
          </Card>

          <Hint type="tip">{HINTS.loan.prepayment}</Hint>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Scenario Tabs */}
          <Tabs
            tabs={[
              { id: 'A', label: 'A: Original' },
              { id: 'B', label: 'B: Prepayment' },
              { id: 'C', label: 'C: Aggressive' },
            ]}
            activeTab={activeScenario}
            onChange={setActiveScenario}
          />

          {/* Scenario Description */}
          <Card>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  {activeScenario === 'A' && 'Original Loan Schedule'}
                  {activeScenario === 'B' && 'With Prepayment + Extra Monthly'}
                  {activeScenario === 'C' && 'Aggressive Repayment'}
                </h3>
                <p className="text-sm text-gray-600">
                  {activeScenario === 'A' && HINTS.loan.scenarioA}
                  {activeScenario === 'B' && HINTS.loan.scenarioB}
                  {activeScenario === 'C' && HINTS.loan.scenarioC}
                </p>
              </div>
              {activeScenario !== 'A' && (
                <Badge variant="success">
                  Save {formatEUR(activeScenario === 'B' ? savings.savingsB : savings.savingsC)}
                </Badge>
              )}
            </div>
          </Card>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Monthly EMI"
              value={formatEUR(activeResult.emi)}
              subValue={formatINR(convertToINR(activeResult.emi))}
            />
            <StatCard
              label="Total Interest"
              value={formatEUR(activeResult.totalInterest)}
              subValue={formatINR(convertToINR(activeResult.totalInterest))}
              trend={activeScenario !== 'A' ? 'down' : 'neutral'}
            />
            <StatCard
              label="Total Payment"
              value={formatEUR(activeResult.totalPayment)}
              subValue={formatINR(convertToINR(activeResult.totalPayment))}
            />
            <StatCard
              label="Loan Duration"
              value={`${activeResult.schedule.length} mo`}
              subValue={activeResult.monthsSaved ? `${activeResult.monthsSaved} months saved` : formatDuration(inputs.termMonths)}
              trend={activeResult.monthsSaved ? 'up' : 'neutral'}
            />
          </div>

          {/* Penalty Info for Scenario B */}
          {activeScenario === 'B' && scenarioB.totalPenalty && scenarioB.totalPenalty > 0 && (
            <Hint type="warning">
              Prepayment penalty: {formatEUR(scenarioB.totalPenalty)} ({formatINR(convertToINR(scenarioB.totalPenalty))}) — Net savings after penalty: {formatEUR(savings.savingsB)}
            </Hint>
          )}

          {/* Comparison Chart - Collapsible */}
          <Card>
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setShowComparison(!showComparison)}
            >
              <CardHeader title="Scenario Comparison" subtitle="Principal vs Interest breakdown" />
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${showComparison ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            {showComparison && (
              <ComparisonChart
                scenarios={[
                  { name: 'Scenario A', totalPayment: scenarioA.totalPayment, totalInterest: scenarioA.totalInterest, color: '#3b82f6' },
                  { name: 'Scenario B', totalPayment: scenarioB.totalPayment, totalInterest: scenarioB.totalInterest, color: '#8b5cf6' },
                  { name: 'Scenario C', totalPayment: scenarioC.totalPayment, totalInterest: scenarioC.totalInterest, color: '#10b981' },
                ]}
              />
            )}
          </Card>

          {/* Breakdown Chart */}
          <Card>
            <CardHeader title="Payment Breakdown" subtitle="Current scenario" />
            <div className="max-w-xs mx-auto">
              <DoughnutChart
                principal={inputs.principal}
                interest={activeResult.totalInterest}
                title="Principal vs Interest"
              />
            </div>
          </Card>

          {/* Monthly Schedule Toggle */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">Monthly Schedule</h3>
            <Toggle
              label="Show Schedule"
              checked={showSchedule}
              onChange={setShowSchedule}
            />
          </div>

          {/* Monthly Schedule Table */}
          {showSchedule && (
            <Card padding="sm">
              <div className="overflow-x-auto max-h-96">
                <ScheduleTable
                  schedule={activeResult.schedule}
                  exchangeRate={exchangeRate}
                  showPenalty={activeScenario === 'B'}
                />
              </div>
            </Card>
          )}

          {/* Savings Summary */}
          <Card variant="gradient">
            <div className="text-center py-4">
              <h3 className="text-xl font-bold mb-2">Savings Summary</h3>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-white/20 rounded-xl p-4">
                  <p className="text-sm text-white/80">Scenario B vs A</p>
                  <p className="text-2xl font-bold">{formatEUR(savings.savingsB)}</p>
                  <p className="text-xs text-white/60">{formatINR(convertToINR(savings.savingsB))}</p>
                  <p className="text-xs text-white/80 mt-1">= Interest saved - Penalty</p>
                </div>
                <div className="bg-white/20 rounded-xl p-4">
                  <p className="text-sm text-white/80">Scenario C vs A</p>
                  <p className="text-2xl font-bold">{formatEUR(savings.savingsC)}</p>
                  <p className="text-xs text-white/60">{formatINR(convertToINR(savings.savingsC))}</p>
                  <p className="text-xs text-white/80 mt-1">= Interest saved</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

interface ScheduleTableProps {
  schedule: MonthlyScheduleEntry[];
  exchangeRate: number;
  showPenalty: boolean;
}

function ScheduleTable({ schedule, exchangeRate, showPenalty }: ScheduleTableProps) {
  return (
    <table className="schedule-table">
      <thead>
        <tr>
          <th>Month</th>
          <th>Payment (€)</th>
          <th>Principal (€)</th>
          <th>Interest (€)</th>
          <th>Balance (€)</th>
          {showPenalty && <th>Penalty (€)</th>}
          <th>Savings (₹)</th>
        </tr>
      </thead>
      <tbody>
        {schedule.map((entry) => (
          <tr key={entry.month}>
            <td className="font-medium">{entry.month}</td>
            <td>{formatNumber(entry.payment)}</td>
            <td>{formatNumber(entry.principal)}</td>
            <td>{formatNumber(entry.interest)}</td>
            <td>{formatNumber(entry.balance)}</td>
            {showPenalty && (
              <td className={entry.penalty ? 'text-red-600 font-medium' : ''}>
                {entry.penalty ? formatNumber(entry.penalty) : '-'}
              </td>
            )}
            <td className="text-gray-500 text-xs">
              {formatINR(entry.balance * exchangeRate)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
