// Core calculation functions for FinDash

/**
 * Calculate EMI (Equated Monthly Installment)
 * EMI = P × r × (1+r)^n / ((1+r)^n - 1)
 */
export function calculateEMI(principal: number, annualRate: number, months: number): number {
  if (months === 0 || annualRate === 0) return principal / (months || 1);
  
  const monthlyRate = annualRate / 12 / 100;
  const emi = principal * monthlyRate * Math.pow(1 + monthlyRate, months) / 
              (Math.pow(1 + monthlyRate, months) - 1);
  return emi;
}

/**
 * Monthly schedule entry structure
 */
export interface MonthlyScheduleEntry {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
  penalty?: number;
  prepayment?: number;
}

/**
 * Generate amortization schedule for a loan
 */
export function generateAmortizationSchedule(
  principal: number,
  annualRate: number,
  months: number,
  extraMonthlyPayment: number = 0,
  prepaymentAmount: number = 0,
  prepaymentMonth: number = 0,
  penaltyRate: number = 1
): MonthlyScheduleEntry[] {
  const schedule: MonthlyScheduleEntry[] = [];
  let balance = principal;
  const monthlyRate = annualRate / 12 / 100;
  const baseEMI = calculateEMI(principal, annualRate, months);
  
  for (let month = 1; month <= months && balance > 0; month++) {
    const interest = balance * monthlyRate;
    let payment = baseEMI + extraMonthlyPayment;
    let principalPayment = payment - interest;
    let penalty = 0;
    let prepayment = 0;
    
    // Handle prepayment
    if (prepaymentAmount > 0 && month === prepaymentMonth) {
      prepayment = Math.min(prepaymentAmount, balance - principalPayment);
      penalty = prepayment * penaltyRate / 100;
      principalPayment += prepayment;
      payment += prepayment + penalty;
    }
    
    // Ensure we don't overpay
    if (principalPayment > balance) {
      principalPayment = balance;
      payment = interest + principalPayment + penalty;
    }
    
    balance = Math.max(0, balance - principalPayment);
    
    schedule.push({
      month,
      payment: Math.round(payment * 100) / 100,
      principal: Math.round(principalPayment * 100) / 100,
      interest: Math.round(interest * 100) / 100,
      balance: Math.round(balance * 100) / 100,
      penalty: penalty > 0 ? Math.round(penalty * 100) / 100 : undefined,
      prepayment: prepayment > 0 ? Math.round(prepayment * 100) / 100 : undefined,
    });
    
    if (balance <= 0) break;
  }
  
  return schedule;
}

/**
 * Scenario A: Original loan schedule (no prepayment, no extra payments)
 */
export function calculateScenarioA(
  principal: number,
  annualRate: number,
  months: number
): { schedule: MonthlyScheduleEntry[]; totalInterest: number; totalPayment: number; emi: number } {
  const schedule = generateAmortizationSchedule(principal, annualRate, months);
  const emi = calculateEMI(principal, annualRate, months);
  const totalPayment = schedule.reduce((sum, entry) => sum + entry.payment, 0);
  const totalInterest = totalPayment - principal;
  
  return { schedule, totalInterest, totalPayment, emi };
}

/**
 * Scenario B: With prepayment (includes penalty)
 */
export function calculateScenarioB(
  principal: number,
  annualRate: number,
  months: number,
  prepaymentAmount: number,
  prepaymentMonth: number,
  penaltyRate: number = 1,
  extraMonthlyPayment: number = 0,
  applyExtraPayment: 'before' | 'after' | 'both' = 'both'
): { schedule: MonthlyScheduleEntry[]; totalInterest: number; totalPayment: number; totalPenalty: number; emi: number; monthsSaved: number } {
  // Determine when to apply extra payment
  let extraBefore = 0;
  let extraAfter = 0;
  if (applyExtraPayment === 'before') extraBefore = extraMonthlyPayment;
  else if (applyExtraPayment === 'after') extraAfter = extraMonthlyPayment;
  else { extraBefore = extraMonthlyPayment; extraAfter = extraMonthlyPayment; }
  
  const schedule: MonthlyScheduleEntry[] = [];
  let balance = principal;
  const monthlyRate = annualRate / 12 / 100;
  const baseEMI = calculateEMI(principal, annualRate, months);
  let totalPenalty = 0;
  
  for (let month = 1; month <= months && balance > 0; month++) {
    const interest = balance * monthlyRate;
    const extra = month < prepaymentMonth ? extraBefore : extraAfter;
    let payment = baseEMI + extra;
    let principalPayment = payment - interest;
    let penalty = 0;
    let prepayment = 0;
    
    if (prepaymentAmount > 0 && month === prepaymentMonth) {
      prepayment = Math.min(prepaymentAmount, balance - principalPayment);
      penalty = prepayment * penaltyRate / 100;
      totalPenalty += penalty;
      principalPayment += prepayment;
      payment += prepayment + penalty;
    }
    
    if (principalPayment > balance) {
      principalPayment = balance;
      payment = interest + principalPayment + penalty;
    }
    
    balance = Math.max(0, balance - principalPayment);
    
    schedule.push({
      month,
      payment: Math.round(payment * 100) / 100,
      principal: Math.round(principalPayment * 100) / 100,
      interest: Math.round(interest * 100) / 100,
      balance: Math.round(balance * 100) / 100,
      penalty: penalty > 0 ? Math.round(penalty * 100) / 100 : undefined,
      prepayment: prepayment > 0 ? Math.round(prepayment * 100) / 100 : undefined,
    });
    
    if (balance <= 0) break;
  }
  
  const totalPayment = schedule.reduce((sum, entry) => sum + entry.payment, 0);
  const totalInterest = totalPayment - principal - totalPenalty;
  const monthsSaved = months - schedule.length;
  
  return { schedule, totalInterest, totalPayment, totalPenalty, emi: baseEMI, monthsSaved };
}

/**
 * Scenario C: Aggressive repayment (extra monthly payments)
 */
export function calculateScenarioC(
  principal: number,
  annualRate: number,
  months: number,
  extraMonthlyPayment: number
): { schedule: MonthlyScheduleEntry[]; totalInterest: number; totalPayment: number; emi: number; monthsSaved: number } {
  const schedule = generateAmortizationSchedule(principal, annualRate, months, extraMonthlyPayment);
  const baseEMI = calculateEMI(principal, annualRate, months);
  const totalPayment = schedule.reduce((sum, entry) => sum + entry.payment, 0);
  const totalInterest = totalPayment - principal;
  const monthsSaved = months - schedule.length;
  
  return { schedule, totalInterest, totalPayment, emi: baseEMI, monthsSaved };
}

/**
 * Calculate FD maturity amount with compound interest
 * A = P × (1 + r/n)^(n×t)
 */
export function calculateFDMaturity(
  principal: number,
  annualRate: number,
  months: number,
  compoundingFrequency: 'monthly' | 'quarterly' | 'half-yearly' | 'yearly' = 'quarterly'
): { maturityAmount: number; totalInterest: number; growthData: { month: number; amount: number }[] } {
  const frequencyMap = {
    'monthly': 12,
    'quarterly': 4,
    'half-yearly': 2,
    'yearly': 1
  };
  
  const n = frequencyMap[compoundingFrequency];
  const r = annualRate / 100;
  const t = months / 12;
  
  const maturityAmount = principal * Math.pow(1 + r / n, n * t);
  const totalInterest = maturityAmount - principal;
  
  // Generate monthly growth data for chart
  const growthData: { month: number; amount: number }[] = [];
  for (let m = 0; m <= months; m++) {
    const currentT = m / 12;
    const amount = principal * Math.pow(1 + r / n, n * currentT);
    growthData.push({ month: m, amount: Math.round(amount * 100) / 100 });
  }
  
  return { 
    maturityAmount: Math.round(maturityAmount * 100) / 100, 
    totalInterest: Math.round(totalInterest * 100) / 100,
    growthData 
  };
}

/**
 * Calculate tax on FD interest (simple calculation)
 */
export function calculateFDTax(interest: number, taxRate: number = 30): number {
  return Math.round(interest * taxRate / 100 * 100) / 100;
}

/**
 * Adjust amount for inflation
 */
export function adjustForInflation(amount: number, years: number, inflationRate: number = 6): number {
  return Math.round(amount / Math.pow(1 + inflationRate / 100, years) * 100) / 100;
}
