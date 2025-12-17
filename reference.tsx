import React, { useState, useEffect, useMemo } from 'react';
import { Calculator, TrendingUp, PiggyBank, Home, BarChart3, ArrowRight, Download, RefreshCw, DollarSign, Calendar, Percent, Info, Sparkles, X, Send } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const FinDash = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [eurToInr, setEurToInr] = useState(90);
  
  // Loan Calculator State
  const [loanAmount, setLoanAmount] = useState(200000);
  const [loanRate, setLoanRate] = useState(4.5);
  const [loanTerm, setLoanTerm] = useState(240); // Changed to months
  const [bulkPrepayment, setBulkPrepayment] = useState(20000);
  const [prepaymentMonth, setPrepaymentMonth] = useState(24);
  const [prepaymentPenalty, setPrepaymentPenalty] = useState(2);
  const [extraMonthly, setExtraMonthly] = useState(500);
  const [extraMonthlyTiming, setExtraMonthlyTiming] = useState('both'); // 'before', 'after', 'both', 'none'
  
  // FD Calculator State
  const [fdPrincipal, setFdPrincipal] = useState(50000);
  const [fdRate, setFdRate] = useState(7);
  const [fdTerm, setFdTerm] = useState(60); // Changed to months
  const [fdCompounding, setFdCompounding] = useState('quarterly');
  const [fdPayoutFrequency, setFdPayoutFrequency] = useState('maturity'); // 'monthly', 'quarterly', 'yearly', 'maturity'
  const [fdTaxRate, setFdTaxRate] = useState(30);

  // AI Insights State
  const [showAIInsights, setShowAIInsights] = useState(false);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Calculate EMI
  const calculateEMI = (principal, rate, termMonths) => {
    const monthlyRate = rate / 12 / 100;
    if (monthlyRate === 0) return principal / termMonths;
    const emi = principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths) / 
                (Math.pow(1 + monthlyRate, termMonths) - 1);
    return emi;
  };

  // Generate Loan Schedule
  const generateLoanSchedule = (principal, rate, termMonths, extraMonthlyAmount = 0, bulkAmount = 0, bulkMonth = 0, penalty = 0, timing = 'none') => {
    const monthlyRate = rate / 12 / 100;
    const emi = calculateEMI(principal, rate, termMonths);
    let balance = principal;
    const schedule = [];
    let month = 1;
    let totalInterest = 0;
    let totalPrincipal = 0;
    let totalPenalty = 0;

    while (balance > 0.01 && month <= termMonths + 120) {
      let monthlyPayment = Math.min(emi, balance * (1 + monthlyRate));
      let extraPayment = 0;
      let bulkPayment = 0;
      let penaltyAmount = 0;
      
      // Apply extra monthly payment based on timing
      if (timing === 'before' && month < bulkMonth) {
        extraPayment = extraMonthlyAmount;
      } else if (timing === 'after' && month > bulkMonth) {
        extraPayment = extraMonthlyAmount;
      } else if (timing === 'both') {
        extraPayment = extraMonthlyAmount;
      }

      const interest = balance * monthlyRate;
      let principalPayment = monthlyPayment - interest;
      
      // Apply bulk prepayment
      if (month === bulkMonth && bulkAmount > 0) {
        bulkPayment = Math.min(bulkAmount, balance - principalPayment);
        penaltyAmount = bulkPayment * (penalty / 100);
        totalPenalty += penaltyAmount;
      }

      // Apply extra monthly payment
      if (extraPayment > 0) {
        extraPayment = Math.min(extraPayment, balance - principalPayment - bulkPayment);
      }

      principalPayment += extraPayment + bulkPayment;
      const totalPayment = monthlyPayment + extraPayment + bulkPayment + penaltyAmount;
      
      balance -= principalPayment;
      totalInterest += interest;
      totalPrincipal += principalPayment;

      schedule.push({
        month,
        payment: totalPayment,
        emi: monthlyPayment,
        extraMonthly: extraPayment,
        bulkPayment,
        penalty: penaltyAmount,
        principal: principalPayment,
        interest,
        balance: Math.max(0, balance)
      });

      if (balance <= 0.01) break;
      month++;
    }

    return {
      schedule,
      totalInterest,
      totalPrincipal,
      totalPenalty,
      totalPayment: totalPrincipal + totalInterest + totalPenalty,
      actualTerm: schedule.length
    };
  };

  // Calculate FD Maturity
  const calculateFD = (principal, rate, termMonths, compounding, payoutFrequency, taxRate) => {
    const compoundingFrequency = {
      'monthly': 12,
      'quarterly': 4,
      'half-yearly': 2,
      'yearly': 1
    };
    
    const payoutFrequencyMonths = {
      'monthly': 1,
      'quarterly': 3,
      'yearly': 12,
      'maturity': termMonths
    };
    
    const n = compoundingFrequency[compounding];
    const r = rate / 100;
    const payoutPeriod = payoutFrequencyMonths[payoutFrequency];
    
    let currentBalance = principal;
    let totalInterestEarned = 0;
    let totalPayouts = 0;
    const breakdown = [];
    
    // If payout is at maturity, use compound interest formula
    if (payoutFrequency === 'maturity') {
      const years = termMonths / 12;
      const maturityAmount = principal * Math.pow((1 + r / n), n * years);
      const interest = maturityAmount - principal;
      const taxOnInterest = interest * (taxRate / 100);
      const postTaxMaturity = maturityAmount - taxOnInterest;
      
      // Generate monthly breakdown for maturity payout
      for (let month = 1; month <= termMonths; month++) {
        const amount = principal * Math.pow((1 + r / n), n * (month / 12));
        const interestEarned = amount - principal;
        const tax = interestEarned * (taxRate / 100);
        breakdown.push({
          month,
          amount: amount,
          interest: interestEarned,
          payout: month === termMonths ? interestEarned : 0,
          tax: month === termMonths ? tax : 0,
          netAmount: amount - tax
        });
      }
      
      return {
        maturityAmount,
        interest,
        taxOnInterest,
        postTaxMaturity,
        totalPayouts: interest,
        breakdown
      };
    }
    
    // For regular payouts (monthly, quarterly, yearly)
    for (let month = 1; month <= termMonths; month++) {
      // Calculate interest for this period
      const monthlyRate = r / 12;
      const interestThisMonth = currentBalance * monthlyRate;
      totalInterestEarned += interestThisMonth;
      
      // Check if it's a payout month
      const isPayout = month % payoutPeriod === 0 || month === termMonths;
      let payoutAmount = 0;
      let taxAmount = 0;
      
      if (isPayout) {
        // Calculate accumulated interest since last payout
        const periodStart = Math.max(1, month - payoutPeriod + 1);
        let periodInterest = 0;
        
        // For simplicity in regular payouts, we calculate simple interest for the payout period
        // More accurate: compound within the period but don't carry forward
        const periodsInPayout = Math.min(payoutPeriod, month);
        const periodRate = r / (12 / periodsInPayout);
        periodInterest = currentBalance * periodRate;
        
        payoutAmount = periodInterest;
        taxAmount = payoutAmount * (taxRate / 100);
        totalPayouts += payoutAmount;
        
        // Balance remains principal since interest is paid out
        currentBalance = principal;
      } else {
        // If no payout this month, interest compounds
        currentBalance += interestThisMonth;
      }
      
      breakdown.push({
        month,
        amount: currentBalance + (isPayout ? 0 : interestThisMonth),
        interest: interestThisMonth,
        payout: payoutAmount,
        tax: taxAmount,
        netAmount: currentBalance + (isPayout ? payoutAmount - taxAmount : interestThisMonth)
      });
    }
    
    const finalAmount = principal + totalPayouts;
    const totalTax = totalPayouts * (taxRate / 100);
    const postTaxTotal = finalAmount - totalTax;
    
    return {
      maturityAmount: finalAmount,
      interest: totalPayouts,
      taxOnInterest: totalTax,
      postTaxMaturity: postTaxTotal,
      totalPayouts,
      breakdown
    };
  };

  // Generate scenarios - memoized to prevent unnecessary recalculations
  const scenarioA = useMemo(() => 
    generateLoanSchedule(loanAmount, loanRate, loanTerm),
    [loanAmount, loanRate, loanTerm]
  );
  
  const scenarioB = useMemo(() => 
    generateLoanSchedule(loanAmount, loanRate, loanTerm, 0, bulkPrepayment, prepaymentMonth, prepaymentPenalty),
    [loanAmount, loanRate, loanTerm, bulkPrepayment, prepaymentMonth, prepaymentPenalty]
  );
  
  const scenarioC = useMemo(() => 
    generateLoanSchedule(loanAmount, loanRate, loanTerm, extraMonthly, bulkPrepayment, prepaymentMonth, prepaymentPenalty, extraMonthlyTiming),
    [loanAmount, loanRate, loanTerm, extraMonthly, bulkPrepayment, prepaymentMonth, prepaymentPenalty, extraMonthlyTiming]
  );
  
  const fdResult = useMemo(() => 
    calculateFD(fdPrincipal, fdRate, fdTerm, fdCompounding, fdPayoutFrequency, fdTaxRate),
    [fdPrincipal, fdRate, fdTerm, fdCompounding, fdPayoutFrequency, fdTaxRate]
  );

  // Comparison: Prepay Loan vs Invest in FD - memoized
  const { loanSavings, fdReturns, netBenefit, comparisonAmount } = useMemo(() => {
    const comparisonAmt = bulkPrepayment;
    const loanSave = scenarioA.totalInterest - scenarioB.totalInterest - scenarioB.totalPenalty;
    const fdRet = calculateFD(comparisonAmt, fdRate, Math.min(scenarioA.actualTerm, fdTerm), fdCompounding, fdPayoutFrequency, fdTaxRate).interest * (1 - fdTaxRate / 100);
    const netBen = loanSave - fdRet;
    
    return {
      loanSavings: loanSave,
      fdReturns: fdRet,
      netBenefit: netBen,
      comparisonAmount: comparisonAmt
    };
  }, [bulkPrepayment, scenarioA, scenarioB, fdRate, fdTerm, fdCompounding, fdPayoutFrequency, fdTaxRate]);

  // Memoize EMI calculation
  const currentEMI = useMemo(() => 
    calculateEMI(loanAmount, loanRate, loanTerm),
    [loanAmount, loanRate, loanTerm]
  );

  // AI Insights Function
  const getAIInsights = async () => {
    if (!aiQuestion.trim()) return;
    
    setAiLoading(true);
    setAiResponse('');
    
    try {
      const context = `
Current Financial Situation:
- Loan Amount: €${loanAmount.toLocaleString()}
- Interest Rate: ${loanRate}% p.a.
- Loan Term: ${loanTerm} months (${(loanTerm/12).toFixed(1)} years)
- Monthly EMI: €${currentEMI.toFixed(2)}
- Bulk Prepayment: €${bulkPrepayment} at month ${prepaymentMonth}
- Extra Monthly Payment: €${extraMonthly}

Scenario Comparison:
- Original Loan: ${scenarioA.actualTerm} months, €${scenarioA.totalInterest.toFixed(2)} total interest
- With Prepayment: ${scenarioB.actualTerm} months, €${scenarioB.totalInterest.toFixed(2)} total interest
- Aggressive Plan: ${scenarioC.actualTerm} months, €${scenarioC.totalInterest.toFixed(2)} total interest

Savings:
- Prepayment saves: €${(scenarioA.totalInterest - scenarioB.totalInterest).toFixed(2)}
- Aggressive plan saves: €${(scenarioA.totalInterest - scenarioC.totalInterest).toFixed(2)}

FD Details:
- Principal: €${fdPrincipal}
- Rate: ${fdRate}%
- Term: ${fdTerm} months
- Maturity: €${fdResult.maturityAmount.toFixed(2)}
- Post-tax: €${fdResult.postTaxMaturity.toFixed(2)}

Prepay vs FD:
- Net benefit of prepaying: €${netBenefit.toFixed(2)}

User Question: ${aiQuestion}

Please provide clear, actionable financial advice based on this data. Be specific with numbers and recommendations.`;

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: context
            }
          ],
        })
      });

      const data = await response.json();
      const answer = data.content
        .map(item => (item.type === "text" ? item.text : ""))
        .filter(Boolean)
        .join("\n");
      
      setAiResponse(answer);
    } catch (error) {
      setAiResponse("Sorry, I couldn't generate insights at the moment. Please try again.");
      console.error("AI Error:", error);
    } finally {
      setAiLoading(false);
    }
  };

  // Dashboard Component
  const Dashboard = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-blue-600 mb-2">FinDash</h1>
        <p className="text-gray-600">Your Complete Financial Planning Dashboard</p>
      </div>

      {/* Currency Converter */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
        <div className="flex items-center gap-3 mb-2">
          <DollarSign className="text-purple-600" size={20} />
          <h3 className="font-semibold">Currency Converter</h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm">1 EUR =</span>
          <input
            type="number"
            value={eurToInr}
            onChange={(e) => setEurToInr(Number(e.target.value))}
            className="w-24 px-3 py-1 border rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            step="0.01"
          />
          <span className="text-sm">INR</span>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Loan Overview */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Loan Overview</h2>
            <Calculator size={32} />
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-blue-100 text-sm">Loan Amount</p>
              <p className="text-2xl font-bold">€{loanAmount.toLocaleString()}</p>
              <p className="text-sm text-blue-100">₹{(loanAmount * eurToInr).toLocaleString('en-IN')}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-blue-100 text-sm">Monthly EMI</p>
                <p className="text-lg font-semibold">€{currentEMI.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-blue-100 text-sm">Interest Rate</p>
                <p className="text-lg font-semibold">{loanRate}%</p>
              </div>
            </div>
            <div>
              <p className="text-blue-100 text-sm">Total Interest (Scenario A)</p>
              <p className="text-xl font-bold">€{scenarioA.totalInterest.toFixed(2)}</p>
              <p className="text-sm text-blue-100">₹{(scenarioA.totalInterest * eurToInr).toLocaleString('en-IN', {maximumFractionDigits: 0})}</p>
            </div>
            <div className="pt-2 border-t border-blue-400">
              <p className="text-blue-100 text-sm">Savings with Prepayment (Scenario C)</p>
              <p className="text-2xl font-bold text-green-300">
                €{(scenarioA.totalInterest - scenarioC.totalInterest).toFixed(2)}
              </p>
              <p className="text-sm text-blue-100">
                ₹{((scenarioA.totalInterest - scenarioC.totalInterest) * eurToInr).toLocaleString('en-IN', {maximumFractionDigits: 0})}
              </p>
            </div>
          </div>
        </div>

        {/* FD Overview */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Fixed Deposit Overview</h2>
            <PiggyBank size={32} />
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-green-100 text-sm">Principal Amount</p>
              <p className="text-2xl font-bold">€{fdPrincipal.toLocaleString()}</p>
              <p className="text-sm text-green-100">₹{(fdPrincipal * eurToInr).toLocaleString('en-IN')}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-green-100 text-sm">Interest Rate</p>
                <p className="text-lg font-semibold">{fdRate}%</p>
              </div>
              <div>
                <p className="text-green-100 text-sm">Term</p>
                <p className="text-lg font-semibold">{fdTerm} months</p>
                <p className="text-xs text-green-100">({(fdTerm / 12).toFixed(1)} years)</p>
              </div>
            </div>
            <div>
              <p className="text-green-100 text-sm">Payout Mode</p>
              <p className="text-md font-semibold">
                {fdPayoutFrequency === 'maturity' ? 'At Maturity' : 
                 fdPayoutFrequency.charAt(0).toUpperCase() + fdPayoutFrequency.slice(1)}
              </p>
            </div>
            <div>
              <p className="text-green-100 text-sm">Maturity Amount (Pre-Tax)</p>
              <p className="text-xl font-bold">€{fdResult.maturityAmount.toFixed(2)}</p>
              <p className="text-sm text-green-100">₹{(fdResult.maturityAmount * eurToInr).toLocaleString('en-IN', {maximumFractionDigits: 0})}</p>
            </div>
            <div className="pt-2 border-t border-green-400">
              <p className="text-green-100 text-sm">Post-Tax Maturity</p>
              <p className="text-2xl font-bold text-yellow-300">
                €{fdResult.postTaxMaturity.toFixed(2)}
              </p>
              <p className="text-sm text-green-100">
                ₹{(fdResult.postTaxMaturity * eurToInr).toLocaleString('en-IN', {maximumFractionDigits: 0})}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Insight */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-6 border border-yellow-200">
        <div className="flex items-center gap-3 mb-4">
          <Info className="text-orange-600" size={24} />
          <h3 className="text-xl font-bold text-gray-800">Smart Money Decision</h3>
        </div>
        <div className="space-y-2">
          <p className="text-gray-700">
            Should you prepay €{bulkPrepayment.toLocaleString()} loan or invest in FD?
          </p>
          <div className="grid md:grid-cols-3 gap-4 mt-4">
            <div className="bg-white rounded-lg p-4 border-2 border-blue-200">
              <p className="text-sm text-gray-600 mb-1">Loan Interest Saved</p>
              <p className="text-xl font-bold text-blue-600">€{loanSavings.toFixed(2)}</p>
              <p className="text-xs text-gray-500">₹{(loanSavings * eurToInr).toLocaleString('en-IN', {maximumFractionDigits: 0})}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border-2 border-green-200">
              <p className="text-sm text-gray-600 mb-1">FD Returns (Post-Tax)</p>
              <p className="text-xl font-bold text-green-600">€{fdReturns.toFixed(2)}</p>
              <p className="text-xs text-gray-500">₹{(fdReturns * eurToInr).toLocaleString('en-IN', {maximumFractionDigits: 0})}</p>
            </div>
            <div className={`bg-white rounded-lg p-4 border-2 ${netBenefit > 0 ? 'border-green-400' : 'border-red-400'}`}>
              <p className="text-sm text-gray-600 mb-1">Net Benefit</p>
              <p className={`text-xl font-bold ${netBenefit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                €{netBenefit.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500">₹{(netBenefit * eurToInr).toLocaleString('en-IN', {maximumFractionDigits: 0})}</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-4 italic">
            💡 {netBenefit > 0 
              ? "Prepaying your loan saves you more money than investing in FD!" 
              : "Investing in FD gives you better returns than loan prepayment."}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4">
        <button
          onClick={() => setCurrentPage('loan')}
          className="bg-white rounded-lg p-4 shadow hover:shadow-lg transition-shadow border-2 border-blue-200 hover:border-blue-400"
        >
          <Calculator className="text-blue-600 mb-2" size={24} />
          <h3 className="font-semibold text-gray-800">Loan Calculator</h3>
          <p className="text-sm text-gray-600 mt-1">Analyze loan scenarios</p>
        </button>
        <button
          onClick={() => setCurrentPage('fd')}
          className="bg-white rounded-lg p-4 shadow hover:shadow-lg transition-shadow border-2 border-green-200 hover:border-green-400"
        >
          <TrendingUp className="text-green-600 mb-2" size={24} />
          <h3 className="font-semibold text-gray-800">FD Calculator</h3>
          <p className="text-sm text-gray-600 mt-1">Calculate FD returns</p>
        </button>
        <button
          onClick={() => setCurrentPage('comparison')}
          className="bg-white rounded-lg p-4 shadow hover:shadow-lg transition-shadow border-2 border-purple-200 hover:border-purple-400"
        >
          <BarChart3 className="text-purple-600 mb-2" size={24} />
          <h3 className="font-semibold text-gray-800">Comparison</h3>
          <p className="text-sm text-gray-600 mt-1">Prepay vs Invest</p>
        </button>
      </div>

      {/* AI Feature Highlight */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white bg-opacity-20 rounded-full p-3">
              <Sparkles size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-1">Need Financial Advice?</h3>
              <p className="text-purple-100">Get AI-powered insights about your loan and investment decisions</p>
            </div>
          </div>
          <button
            onClick={() => setShowAIInsights(true)}
            className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-colors"
          >
            Ask AI
          </button>
        </div>
      </div>
    </div>
  );

  // Loan Calculator Component
  const LoanCalculator = () => {
    const exportToCSV = (scenario, name) => {
      const headers = ['Month', 'EMI', 'Extra Monthly', 'Bulk Payment', 'Penalty', 'Total Payment', 'Principal', 'Interest', 'Balance EUR', 'Balance INR'];
      const rows = scenario.schedule.map(row => [
        row.month,
        row.emi.toFixed(2),
        row.extraMonthly.toFixed(2),
        row.bulkPayment.toFixed(2),
        row.penalty.toFixed(2),
        row.payment.toFixed(2),
        row.principal.toFixed(2),
        row.interest.toFixed(2),
        row.balance.toFixed(2),
        (row.balance * eurToInr).toFixed(2)
      ]);
      
      const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${name}-schedule.csv`;
      a.click();
    };

    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Loan Calculator</h2>
        
        {/* Input Form */}
        <div className="bg-white rounded-lg p-6 shadow-md border">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Loan Details</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Loan Amount (€)
              </label>
              <input
                type="number"
                value={loanAmount}
                onChange={(e) => setLoanAmount(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Interest Rate (% p.a.)
              </label>
              <input
                type="number"
                value={loanRate}
                onChange={(e) => setLoanRate(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                step="0.1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Loan Term (Months)
              </label>
              <input
                type="number"
                value={loanTerm}
                onChange={(e) => setLoanTerm(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">{(loanTerm / 12).toFixed(1)} years</p>
            </div>
          </div>
          
          <h3 className="text-xl font-semibold mt-6 mb-4 text-gray-800">Prepayment Options</h3>
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bulk Prepayment (€)
              </label>
              <input
                type="number"
                value={bulkPrepayment}
                onChange={(e) => setBulkPrepayment(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prepayment Month
              </label>
              <input
                type="number"
                value={prepaymentMonth}
                onChange={(e) => setPrepaymentMonth(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Penalty (%)
              </label>
              <input
                type="number"
                value={prepaymentPenalty}
                onChange={(e) => setPrepaymentPenalty(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                step="0.1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Extra Monthly (€)
              </label>
              <input
                type="number"
                value={extraMonthly}
                onChange={(e) => setExtraMonthly(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Extra Monthly Payment Timing
            </label>
            <div className="flex flex-wrap gap-3">
              {[
                { value: 'none', label: 'None', color: 'gray' },
                { value: 'before', label: 'Before Bulk Prepayment', color: 'blue' },
                { value: 'after', label: 'After Bulk Prepayment', color: 'green' },
                { value: 'both', label: 'Throughout Loan', color: 'purple' }
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setExtraMonthlyTiming(option.value)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    extraMonthlyTiming === option.value
                      ? `bg-${option.color}-500 text-white`
                      : `bg-${option.color}-100 text-${option.color}-700 hover:bg-${option.color}-200`
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Scenario Comparison */}
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { name: 'Scenario A', data: scenarioA, desc: 'Original Schedule', color: 'blue' },
            { name: 'Scenario B', data: scenarioB, desc: 'With Bulk Prepayment', color: 'green' },
            { name: 'Scenario C', data: scenarioC, desc: 'Aggressive Repayment', color: 'purple' }
          ].map(scenario => (
            <div key={scenario.name} className={`bg-gradient-to-br from-${scenario.color}-50 to-${scenario.color}-100 rounded-lg p-6 border-2 border-${scenario.color}-200`}>
              <h3 className="text-xl font-bold text-gray-800 mb-2">{scenario.name}</h3>
              <p className="text-sm text-gray-600 mb-4">{scenario.desc}</p>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Monthly EMI</p>
                  <p className="text-2xl font-bold text-gray-800">
                    €{currentEMI.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Interest</p>
                  <p className="text-xl font-bold text-gray-800">€{scenario.data.totalInterest.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">₹{(scenario.data.totalInterest * eurToInr).toLocaleString('en-IN', {maximumFractionDigits: 0})}</p>
                </div>
                {scenario.data.totalPenalty > 0 && (
                  <div>
                    <p className="text-sm text-gray-600">Penalty</p>
                    <p className="text-lg font-semibold text-red-600">€{scenario.data.totalPenalty.toFixed(2)}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">Total Payment</p>
                  <p className="text-xl font-bold text-gray-800">€{scenario.data.totalPayment.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">₹{(scenario.data.totalPayment * eurToInr).toLocaleString('en-IN', {maximumFractionDigits: 0})}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Loan Duration</p>
                  <p className="text-lg font-semibold text-gray-800">
                    {Math.floor(scenario.data.actualTerm / 12)} years {scenario.data.actualTerm % 12} months
                  </p>
                </div>
                {scenario.name !== 'Scenario A' && (
                  <div className="pt-3 border-t border-gray-300">
                    <p className="text-sm text-gray-600">Savings vs Scenario A</p>
                    <p className="text-xl font-bold text-green-600">
                      €{(scenarioA.totalInterest - scenario.data.totalInterest).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">
                      ₹{((scenarioA.totalInterest - scenario.data.totalInterest) * eurToInr).toLocaleString('en-IN', {maximumFractionDigits: 0})}
                    </p>
                    <p className="text-xs text-gray-600 mt-1 italic">
                      Net savings after deducting penalties
                    </p>
                  </div>
                )}
                <button
                  onClick={() => exportToCSV(scenario.data, scenario.name)}
                  className={`w-full mt-3 flex items-center justify-center gap-2 px-4 py-2 bg-${scenario.color}-600 text-white rounded-lg hover:bg-${scenario.color}-700 transition-colors`}
                >
                  <Download size={16} />
                  Export CSV
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Detailed Schedule Tables */}
        {[
          { name: 'Scenario A', data: scenarioA, color: 'blue' },
          { name: 'Scenario B', data: scenarioB, color: 'green' },
          { name: 'Scenario C', data: scenarioC, color: 'purple' }
        ].map(scenario => (
          <div key={scenario.name} className="bg-white rounded-lg p-6 shadow-md border">
            <h3 className="text-xl font-bold text-gray-800 mb-4">{scenario.name} - Detailed Schedule</h3>
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left">Month</th>
                    <th className="px-3 py-2 text-right">EMI</th>
                    <th className="px-3 py-2 text-right">Extra</th>
                    <th className="px-3 py-2 text-right">Bulk</th>
                    {scenario.data.totalPenalty > 0 && <th className="px-3 py-2 text-right">Penalty</th>}
                    <th className="px-3 py-2 text-right">Total Payment</th>
                    <th className="px-3 py-2 text-right">Principal</th>
                    <th className="px-3 py-2 text-right">Interest</th>
                    <th className="px-3 py-2 text-right">Balance (€)</th>
                    <th className="px-3 py-2 text-right">Balance (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {scenario.data.schedule.map((row, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50' : ''}>
                      <td className="px-3 py-2">{row.month}</td>
                      <td className="px-3 py-2 text-right">€{row.emi.toFixed(2)}</td>
                      <td className="px-3 py-2 text-right">€{row.extraMonthly.toFixed(2)}</td>
                      <td className="px-3 py-2 text-right">€{row.bulkPayment.toFixed(2)}</td>
                      {scenario.data.totalPenalty > 0 && (
                        <td className="px-3 py-2 text-right text-red-600">€{row.penalty.toFixed(2)}</td>
                      )}
                      <td className="px-3 py-2 text-right font-semibold">€{row.payment.toFixed(2)}</td>
                      <td className="px-3 py-2 text-right">€{row.principal.toFixed(2)}</td>
                      <td className="px-3 py-2 text-right">€{row.interest.toFixed(2)}</td>
                      <td className="px-3 py-2 text-right font-medium">€{row.balance.toFixed(2)}</td>
                      <td className="px-3 py-2 text-right text-gray-600">₹{(row.balance * eurToInr).toLocaleString('en-IN', {maximumFractionDigits: 0})}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {/* Chart */}
        <div className="bg-white rounded-lg p-6 shadow-md border">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Balance Comparison Over Time</h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                type="number" 
                domain={[0, Math.max(scenarioA.actualTerm, scenarioB.actualTerm, scenarioC.actualTerm)]}
                label={{ value: 'Month', position: 'insideBottom', offset: -5 }}
              />
              <YAxis label={{ value: 'Balance (€)', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={(value) => `€${value.toFixed(2)}`} />
              <Legend />
              <Line 
                data={scenarioA.schedule} 
                type="monotone" 
                dataKey="balance" 
                stroke="#3b82f6" 
                name="Scenario A" 
                strokeWidth={2}
              />
              <Line 
                data={scenarioB.schedule} 
                type="monotone" 
                dataKey="balance" 
                stroke="#10b981" 
                name="Scenario B" 
                strokeWidth={2}
              />
              <Line 
                data={scenarioC.schedule} 
                type="monotone" 
                dataKey="balance" 
                stroke="#8b5cf6" 
                name="Scenario C" 
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  // FD Calculator Component
  const FDCalculator = () => {
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Fixed Deposit Calculator</h2>
        
        {/* Input Form */}
        <div className="bg-white rounded-lg p-6 shadow-md border">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">FD Details</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Principal Amount (€)
              </label>
              <input
                type="number"
                value={fdPrincipal}
                onChange={(e) => setFdPrincipal(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Interest Rate (% p.a.)
              </label>
              <input
                type="number"
                value={fdRate}
                onChange={(e) => setFdRate(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                step="0.1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Term (Months)
              </label>
              <input
                type="number"
                value={fdTerm}
                onChange={(e) => setFdTerm(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">{(fdTerm / 12).toFixed(1)} years</p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Compounding Frequency
              </label>
              <select
                value={fdCompounding}
                onChange={(e) => setFdCompounding(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="half-yearly">Half-Yearly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Interest Payout
              </label>
              <select
                value={fdPayoutFrequency}
                onChange={(e) => setFdPayoutFrequency(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="maturity">At Maturity (Reinvested)</option>
                <option value="monthly">Monthly Payout</option>
                <option value="quarterly">Quarterly Payout</option>
                <option value="yearly">Yearly Payout</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {fdPayoutFrequency === 'maturity' ? 'Interest compounds' : 'Interest paid out regularly'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tax Rate (%)
              </label>
              <input
                type="number"
                value={fdTaxRate}
                onChange={(e) => setFdTaxRate(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                step="0.1"
              />
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border-2 border-green-200">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Maturity Summary</h3>
            <div className="space-y-3">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                <p className="text-xs font-semibold text-blue-800 mb-1">💡 Payout Impact</p>
                <p className="text-xs text-blue-700">
                  {fdPayoutFrequency === 'maturity' 
                    ? 'Full compounding effect - all interest reinvested until maturity for maximum returns' 
                    : `With ${fdPayoutFrequency} payouts, interest is withdrawn regularly, reducing compounding benefits but providing regular income`}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Principal Amount</p>
                <p className="text-2xl font-bold text-gray-800">€{fdPrincipal.toLocaleString()}</p>
                <p className="text-sm text-gray-500">₹{(fdPrincipal * eurToInr).toLocaleString('en-IN')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Interest Earned</p>
                <p className="text-xl font-bold text-green-600">€{fdResult.interest.toFixed(2)}</p>
                <p className="text-sm text-gray-500">₹{(fdResult.interest * eurToInr).toLocaleString('en-IN', {maximumFractionDigits: 0})}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Tax on Interest ({fdTaxRate}%)</p>
                <p className="text-lg font-semibold text-red-600">-€{fdResult.taxOnInterest.toFixed(2)}</p>
                <p className="text-sm text-gray-500">-₹{(fdResult.taxOnInterest * eurToInr).toLocaleString('en-IN', {maximumFractionDigits: 0})}</p>
              </div>
              {fdPayoutFrequency !== 'maturity' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-gray-600">Total Payouts Received</p>
                  <p className="text-lg font-bold text-blue-600">€{fdResult.totalPayouts.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">Regular {fdPayoutFrequency} income</p>
                </div>
              )}
              <div className="pt-3 border-t border-green-300">
                <p className="text-sm text-gray-600">Maturity Amount (Pre-Tax)</p>
                <p className="text-2xl font-bold text-gray-800">€{fdResult.maturityAmount.toFixed(2)}</p>
                <p className="text-sm text-gray-500">₹{(fdResult.maturityAmount * eurToInr).toLocaleString('en-IN', {maximumFractionDigits: 0})}</p>
              </div>
              <div className="pt-3 border-t border-green-300">
                <p className="text-sm text-gray-600">Post-Tax Maturity</p>
                <p className="text-3xl font-bold text-green-600">€{fdResult.postTaxMaturity.toFixed(2)}</p>
                <p className="text-sm text-gray-500">₹{(fdResult.postTaxMaturity * eurToInr).toLocaleString('en-IN', {maximumFractionDigits: 0})}</p>
                <p className="text-xs text-gray-500 mt-2 italic">
                  {fdPayoutFrequency === 'maturity' 
                    ? '💰 Full compounding - interest reinvested' 
                    : `💸 Regular ${fdPayoutFrequency} payouts - reduced compounding`}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md border">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Growth Breakdown</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Principal', value: fdPrincipal },
                    { name: 'Interest (Post-Tax)', value: fdResult.interest - fdResult.taxOnInterest }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#34d399" />
                </Pie>
                <Tooltip formatter={(value) => `€${value.toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Yearly Breakdown */}
        <div className="bg-white rounded-lg p-6 shadow-md border">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Monthly Breakdown</h3>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left">Month</th>
                  <th className="px-4 py-2 text-right">Balance (€)</th>
                  <th className="px-4 py-2 text-right">Balance (₹)</th>
                  <th className="px-4 py-2 text-right">Interest (€)</th>
                  <th className="px-4 py-2 text-right">Payout (€)</th>
                  <th className="px-4 py-2 text-right">Tax (€)</th>
                  <th className="px-4 py-2 text-right">Net Value (€)</th>
                  <th className="px-4 py-2 text-right">Net Value (₹)</th>
                </tr>
              </thead>
              <tbody>
                {fdResult.breakdown.map((row, idx) => (
                  <tr key={idx} className={row.payout > 0 ? 'bg-green-50 font-medium' : (idx % 2 === 0 ? 'bg-gray-50' : '')}>
                    <td className="px-4 py-2">
                      {row.month} {row.payout > 0 && '💰'}
                    </td>
                    <td className="px-4 py-2 text-right font-medium">€{row.amount.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right text-gray-600">₹{(row.amount * eurToInr).toLocaleString('en-IN', {maximumFractionDigits: 0})}</td>
                    <td className="px-4 py-2 text-right text-green-600">€{row.interest.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right font-semibold text-blue-600">
                      {row.payout > 0 ? `€${row.payout.toFixed(2)}` : '-'}
                    </td>
                    <td className="px-4 py-2 text-right text-red-600">
                      {row.tax > 0 ? `€${row.tax.toFixed(2)}` : '-'}
                    </td>
                    <td className="px-4 py-2 text-right font-semibold">€{row.netAmount.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right text-gray-600">₹{(row.netAmount * eurToInr).toLocaleString('en-IN', {maximumFractionDigits: 0})}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Growth Chart */}
        <div className="bg-white rounded-lg p-6 shadow-md border">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Growth Over Time</h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={fdResult.breakdown}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                label={{ value: 'Month', position: 'insideBottom', offset: -5 }}
                interval={Math.floor(fdTerm / 10)}
              />
              <YAxis label={{ value: 'Amount (€)', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={(value) => `€${value.toFixed(2)}`} />
              <Legend />
              <Line type="monotone" dataKey="amount" stroke="#10b981" name="Balance" strokeWidth={2} />
              <Line type="monotone" dataKey="netAmount" stroke="#34d399" name="Net Value (Post-Tax)" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  // Comparison Component
  const Comparison = () => {
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Prepay Loan vs Invest in FD</h2>
        
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border-2 border-purple-200">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">Financial Decision Analysis</h3>
          <p className="text-gray-700 mb-4">
            Comparing the benefit of prepaying €{bulkPrepayment.toLocaleString()} on your loan versus investing the same amount in a Fixed Deposit.
          </p>
          
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Loan Prepayment Option */}
            <div className="bg-white rounded-lg p-6 border-2 border-blue-300">
              <div className="flex items-center gap-3 mb-4">
                <Calculator className="text-blue-600" size={32} />
                <h4 className="text-xl font-bold text-gray-800">Loan Prepayment</h4>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Prepayment Amount</p>
                  <p className="text-2xl font-bold text-blue-600">€{bulkPrepayment.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">₹{(bulkPrepayment * eurToInr).toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Interest Saved</p>
                  <p className="text-xl font-bold text-green-600">€{loanSavings.toFixed(2)}</p>
                  <p className="text-sm text-gray-500">₹{(loanSavings * eurToInr).toLocaleString('en-IN', {maximumFractionDigits: 0})}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Prepayment Penalty</p>
                  <p className="text-lg font-semibold text-red-600">-€{scenarioB.totalPenalty.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Time Saved</p>
                  <p className="text-lg font-semibold text-gray-800">
                    {Math.floor((scenarioA.actualTerm - scenarioB.actualTerm) / 12)} years {(scenarioA.actualTerm - scenarioB.actualTerm) % 12} months
                  </p>
                </div>
                <div className="pt-3 border-t border-blue-200">
                  <p className="text-sm text-gray-600 font-semibold">Net Benefit</p>
                  <p className="text-2xl font-bold text-blue-600">€{loanSavings.toFixed(2)}</p>
                  <p className="text-xs text-gray-500 italic mt-1">
                    Total interest reduction minus penalty
                  </p>
                </div>
              </div>
            </div>

            {/* FD Investment Option */}
            <div className="bg-white rounded-lg p-6 border-2 border-green-300">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="text-green-600" size={32} />
                <h4 className="text-xl font-bold text-gray-800">FD Investment</h4>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Investment Amount</p>
                  <p className="text-2xl font-bold text-green-600">€{comparisonAmount.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">₹{(comparisonAmount * eurToInr).toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Interest Earned (Pre-Tax)</p>
                  <p className="text-xl font-bold text-green-600">
                    €{calculateFD(comparisonAmount, fdRate, Math.min(scenarioA.actualTerm, fdTerm), fdCompounding, fdPayoutFrequency, fdTaxRate).interest.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tax Liability</p>
                  <p className="text-lg font-semibold text-red-600">
                    -€{calculateFD(comparisonAmount, fdRate, Math.min(scenarioA.actualTerm, fdTerm), fdCompounding, fdPayoutFrequency, fdTaxRate).taxOnInterest.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">FD Tenure</p>
                  <p className="text-lg font-semibold text-gray-800">
                    {Math.min(scenarioA.actualTerm, fdTerm)} months ({(Math.min(scenarioA.actualTerm, fdTerm) / 12).toFixed(1)} years)
                  </p>
                </div>
                <div className="pt-3 border-t border-green-200">
                  <p className="text-sm text-gray-600 font-semibold">Net Returns (Post-Tax)</p>
                  <p className="text-2xl font-bold text-green-600">€{fdReturns.toFixed(2)}</p>
                  <p className="text-xs text-gray-500 italic mt-1">
                    After deducting tax at {fdTaxRate}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Final Verdict */}
          <div className={`bg-gradient-to-r ${netBenefit > 0 ? 'from-blue-100 to-blue-200 border-blue-400' : 'from-green-100 to-green-200 border-green-400'} rounded-lg p-6 border-2`}>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-2xl font-bold text-gray-800">Recommendation</h4>
              <ArrowRight className={netBenefit > 0 ? 'text-blue-600' : 'text-green-600'} size={32} />
            </div>
            <div className="space-y-3">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm text-gray-600">Loan Benefit</p>
                  <p className="text-2xl font-bold text-blue-600">€{loanSavings.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">₹{(loanSavings * eurToInr).toLocaleString('en-IN', {maximumFractionDigits: 0})}</p>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm text-gray-600">FD Benefit</p>
                  <p className="text-2xl font-bold text-green-600">€{fdReturns.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">₹{(fdReturns * eurToInr).toLocaleString('en-IN', {maximumFractionDigits: 0})}</p>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm text-gray-600">Net Advantage</p>
                  <p className={`text-2xl font-bold ${netBenefit > 0 ? 'text-blue-600' : 'text-green-600'}`}>
                    €{Math.abs(netBenefit).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500">₹{(Math.abs(netBenefit) * eurToInr).toLocaleString('en-IN', {maximumFractionDigits: 0})}</p>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 mt-4">
                <p className="text-lg font-bold text-gray-800 mb-2">
                  {netBenefit > 0 
                    ? '✅ Prepaying your loan is the better choice!' 
                    : '✅ Investing in FD is the better choice!'}
                </p>
                <p className="text-gray-700">
                  {netBenefit > 0 
                    ? `By prepaying €${bulkPrepayment.toLocaleString()} on your loan, you'll save €${Math.abs(netBenefit).toFixed(2)} more than investing the same amount in an FD. This accounts for the ${prepaymentPenalty}% prepayment penalty and ${fdTaxRate}% tax on FD interest.`
                    : `By investing €${comparisonAmount.toLocaleString()} in an FD, you'll earn €${Math.abs(netBenefit).toFixed(2)} more than the interest you'd save by prepaying your loan. This accounts for the ${prepaymentPenalty}% prepayment penalty and ${fdTaxRate}% tax on FD returns.`}
                </p>
                <p className="text-sm text-gray-600 mt-2 italic">
                  💡 Calculation: Net savings = (Interest saved on loan - Prepayment penalty) - (FD returns after tax)
                </p>
              </div>
            </div>
          </div>

          {/* Detailed Comparison Chart */}
          <div className="bg-white rounded-lg p-6 shadow-md border mt-6">
            <h4 className="text-xl font-bold text-gray-800 mb-4">Visual Comparison</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={[
                  {
                    option: 'Loan Prepayment',
                    benefit: loanSavings,
                    cost: scenarioB.totalPenalty,
                    net: loanSavings
                  },
                  {
                    option: 'FD Investment',
                    benefit: calculateFD(comparisonAmount, fdRate, Math.min(scenarioA.actualTerm, fdTerm), fdCompounding, fdPayoutFrequency, fdTaxRate).interest,
                    cost: calculateFD(comparisonAmount, fdRate, Math.min(scenarioA.actualTerm, fdTerm), fdCompounding, fdPayoutFrequency, fdTaxRate).taxOnInterest,
                    net: fdReturns
                  }
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="option" />
                <YAxis label={{ value: 'Amount (€)', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(value) => `€${value.toFixed(2)}`} />
                <Legend />
                <Bar dataKey="benefit" fill="#10b981" name="Gross Benefit" />
                <Bar dataKey="cost" fill="#ef4444" name="Cost/Tax" />
                <Bar dataKey="net" fill="#3b82f6" name="Net Benefit" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  // Navigation
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'loan', label: 'Loan Calculator', icon: Calculator },
    { id: 'fd', label: 'FD Calculator', icon: TrendingUp },
    { id: 'comparison', label: 'Comparison', icon: BarChart3 }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg p-2">
                <Calculator className="text-white" size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">FinDash</h1>
                <p className="text-xs text-gray-500">Financial Planning Made Easy</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setLoanAmount(200000);
                  setLoanRate(4.5);
                  setLoanTerm(240);
                  setBulkPrepayment(20000);
                  setPrepaymentMonth(24);
                  setPrepaymentPenalty(2);
                  setExtraMonthly(500);
                  setExtraMonthlyTiming('both');
                  setFdPrincipal(50000);
                  setFdRate(7);
                  setFdTerm(60);
                  setFdCompounding('quarterly');
                  setFdPayoutFrequency('maturity');
                  setFdTaxRate(30);
                  setEurToInr(90);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <RefreshCw size={16} />
                <span className="hidden sm:inline">Reset All</span>
              </button>
              <button
                onClick={() => setShowAIInsights(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 rounded-lg transition-all"
              >
                <Sparkles size={16} />
                <span className="hidden sm:inline">AI Insights</span>
              </button>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="flex gap-2 overflow-x-auto">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                  currentPage === item.id
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {currentPage === 'dashboard' && <Dashboard />}
        {currentPage === 'loan' && <LoanCalculator />}
        {currentPage === 'fd' && <FDCalculator />}
        {currentPage === 'comparison' && <Comparison />}
      </main>

      {/* AI Insights Floating Button */}
      <button
        onClick={() => setShowAIInsights(!showAIInsights)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all hover:scale-110 z-50"
        title="AI Financial Insights"
      >
        <Sparkles size={24} />
      </button>

      {/* AI Insights Modal */}
      {showAIInsights && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles size={28} />
                <div>
                  <h2 className="text-2xl font-bold">AI Financial Insights</h2>
                  <p className="text-sm text-purple-100">Ask anything about your financial scenario</p>
                </div>
              </div>
              <button
                onClick={() => setShowAIInsights(false)}
                className="hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Quick Questions */}
              <div className="mb-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">Quick Questions:</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Should I prepay my loan or invest in FD?",
                    "What's the best strategy to save money?",
                    "How much will I save with aggressive payments?",
                    "Is my loan repayment plan optimal?",
                    "What are the tax implications of my FD?"
                  ].map((question, idx) => (
                    <button
                      key={idx}
                      onClick={() => setAiQuestion(question)}
                      className="text-xs bg-purple-50 text-purple-700 px-3 py-2 rounded-lg hover:bg-purple-100 transition-colors border border-purple-200"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Area */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Question
                </label>
                <textarea
                  value={aiQuestion}
                  onChange={(e) => setAiQuestion(e.target.value)}
                  placeholder="Ask me anything about your loan, FD, or financial strategy..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  rows="3"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      getAIInsights();
                    }
                  }}
                />
              </div>

              {/* Response Area */}
              {aiResponse && (
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200 mb-4">
                  <div className="flex items-start gap-3">
                    <Sparkles className="text-purple-500 flex-shrink-0 mt-1" size={20} />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-800 mb-2">AI Insights</p>
                      <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {aiResponse}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {aiLoading && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-500"></div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t bg-gray-50 p-4 flex gap-3">
              <button
                onClick={getAIInsights}
                disabled={!aiQuestion.trim() || aiLoading}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={18} />
                {aiLoading ? 'Analyzing...' : 'Get Insights'}
              </button>
              <button
                onClick={() => {
                  setAiQuestion('');
                  setAiResponse('');
                }}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Clear
              </button>
            </div>

            {/* Disclaimer */}
            <div className="bg-yellow-50 border-t border-yellow-200 p-3">
              <p className="text-xs text-yellow-800 text-center">
                ⚠️ AI insights are for informational purposes only. Consult a financial advisor for personalized advice.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-600">
          <p className="text-sm">
            FinDash - Your Complete Financial Planning Tool with AI Insights
          </p>
          <p className="text-xs text-gray-500 mt-1">
            All calculations are estimates. Please consult with a financial advisor for personalized advice.
          </p>
          <p className="text-xs text-purple-600 mt-2 flex items-center justify-center gap-1">
            <Sparkles size={14} />
            Powered by Claude AI for intelligent financial insights
          </p>
        </div>
      </footer>
    </div>
  );
};

export default FinDash;