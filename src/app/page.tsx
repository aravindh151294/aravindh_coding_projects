'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, StatCard, Hint, Input, Select } from '@/components/ui';
import { useFormatters, formatDuration } from '@/hooks/useFormatters';
import { DEFAULT_LOAN, HINTS } from '@/lib/constants';
import { calculateEMI, calculatePortfolioMaturity } from '@/lib/calculations';
import { useAppState, LocalePreference } from '@/context/AppContext';

export default function DashboardPage() {
  const { investment, currency, setCurrency } = useAppState();
  const { formatEUR } = useFormatters();

  // Calculate summary values
  const loanEMI = calculateEMI(DEFAULT_LOAN.principal, DEFAULT_LOAN.annualRate, DEFAULT_LOAN.termMonths);
  const totalLoanPayment = loanEMI * DEFAULT_LOAN.termMonths;
  const totalLoanInterest = totalLoanPayment - DEFAULT_LOAN.principal;

  const portfolioResult = calculatePortfolioMaturity(
    investment.totalAmount,
    investment.allocations,
    investment.termMonths,
    investment.compoundingFrequency
  );

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="text-center py-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          <span className="gradient-text">FinDash</span>
        </h1>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Your intelligent financial planning companion. Analyze loans, plan investments, and make smarter decisions.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Default Loan EMI"
          value={formatEUR(loanEMI)}
          subValue={formatDuration(DEFAULT_LOAN.termMonths)}
          icon={<LoanIcon />}
        />
        <StatCard
          label="Total Interest"
          value={formatEUR(totalLoanInterest)}
          trend="down"
          icon={<InterestIcon />}
        />
        <StatCard
          label="Portfolio Value"
          value={formatEUR(portfolioResult.maturityAmount)}
          subValue={`+${formatEUR(portfolioResult.totalInterest)}`}
          trend="up"
          icon={<FDIcon />}
        />
        <StatCard
          label="Weighted Rate"
          value={`${portfolioResult.weightedRate}%`}
          subValue="Avg. return"
          icon={<SavingsIcon />}
        />
      </div>

      {/* Feature Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Loan Calculator Card */}
        <Link href="/loan" className="block card-hover">
          <Card className="h-full">
            <CardHeader
              title="Loan Calculator"
              subtitle="Analyze 3 repayment strategies"
              icon={<LoanIcon />}
            />
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Scenario A</span>
                <span className="font-medium">Original Schedule</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Scenario B</span>
                <span className="font-medium">With Prepayment</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Scenario C</span>
                <span className="font-medium">Aggressive Repayment</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <span className="text-blue-600 font-medium text-sm flex items-center gap-1">
                Open Calculator
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          </Card>
        </Link>

        {/* Investment Planner Card */}
        <Link href="/fd" className="block card-hover">
          <Card className="h-full">
            <CardHeader
              title="Investment Planner"
              subtitle="Multi-instrument portfolio"
              icon={<FDIcon />}
            />
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Instruments</span>
                <span className="font-medium">FD, Bonds, Gold, Equity, MF</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Risk Analysis</span>
                <span className="font-medium">Color-coded levels</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Input Mode</span>
                <span className="font-medium">% or Amount</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <span className="text-blue-600 font-medium text-sm flex items-center gap-1">
                Open Planner
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          </Card>
        </Link>
      </div>

      {/* Comparison CTA */}
      <Link href="/compare" className="block card-hover">
        <Card variant="gradient" className="text-center">
          <div className="py-4">
            <h3 className="text-2xl font-bold mb-2">Compare Scenarios</h3>
            <p className="text-white/80 mb-4">
              Should you prepay your loan or invest? Find out with our detailed comparison tool.
            </p>
            <span className="inline-flex items-center gap-2 px-6 py-2 bg-white/20 rounded-xl text-white font-medium hover:bg-white/30 transition-colors">
              Start Comparison
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </div>
        </Card>
      </Link>

      {/* Settings Card */}
      <Card>
        <CardHeader title="Settings" subtitle="Centralized configuration" />
        <div className="grid md:grid-cols-2 gap-4">
          <Input
            label="EUR to INR Exchange Rate"
            type="number"
            step="0.1"
            prefix="₹"
            suffix="per €"
            value={currency.eurToInr}
            onChange={(e) => setCurrency({ eurToInr: Number(e.target.value) })}
            hint="Used across all calculations"
          />
          <Select
            label="Number Format"
            options={[
              { value: 'en-US', label: 'English (1,234.56)' },
              { value: 'de-DE', label: 'German (1.234,56)' },
              { value: 'browser', label: 'Browser Default' },
            ]}
            value={currency.locale}
            onChange={(e) => setCurrency({ locale: e.target.value as LocalePreference })}
            hint="Decimal and thousand separators"
          />
        </div>
      </Card>

      {/* Hints */}
      <div className="grid md:grid-cols-2 gap-4">
        <Hint type="tip">{HINTS.loan.prepayment}</Hint>
        <Hint type="info">{HINTS.fd.compounding}</Hint>
      </div>

      {/* Footer Info */}
      <div className="text-center text-sm text-gray-500 py-4">
        <p>💡 Tip: Click the <span className="text-blue-500">AI button</span> in the corner for personalized financial insights!</p>
      </div>
    </div>
  );
}

// Icon Components
function LoanIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

function InterestIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
    </svg>
  );
}

function FDIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function SavingsIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}
