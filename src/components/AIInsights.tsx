'use client';

import React, { useState, useCallback, useEffect } from 'react';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

// Pre-defined financial insights for offline/immediate responses
const financialInsights = [
    "💡 **Prepayment Strategy**: Making even small prepayments early in your loan tenure can save significant interest. The earlier you prepay, the more you save!",
    "📊 **EMI vs Prepayment**: Regular EMI reduces interest linearly, but lump-sum prepayments create exponential savings by reducing principal faster.",
    "💰 **The 10% Rule**: Try to prepay at least 10% of your outstanding principal annually to significantly reduce your loan tenure.",
    "🎯 **Opportunity Cost**: Before prepaying your loan, compare the effective interest rate (after tax benefits) with potential FD returns.",
    "📈 **FD Laddering**: Instead of one large FD, create multiple FDs with different maturities for better liquidity and rate optimization.",
    "⚠️ **Prepayment Penalty**: Most banks allow prepayment without penalty after 1 year. Check your loan agreement for specific terms.",
    "🔄 **Balance Transfer**: If your current loan rate is 2%+ higher than market rates, consider a balance transfer to save on interest.",
    "💵 **Tax Impact**: Remember that FD interest is fully taxable. For high tax brackets, consider tax-saving FDs or debt mutual funds.",
    "📉 **Inflation Matters**: Your real FD returns = FD rate - Inflation rate. A 7% FD with 6% inflation gives only 1% real return.",
    "🏠 **Home Loan Tip**: Home loan interest up to €2 lakh/year is tax deductible under Section 24(b). Factor this when comparing with FD.",
];

export function AIInsights() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Add welcome message on first open
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([{
                role: 'assistant',
                content: "👋 Hi! I'm your AI financial assistant. I can help you understand loan strategies, FD investments, and compare different scenarios. Ask me anything!\n\n**Quick questions:**\n- Should I prepay my loan or invest in FD?\n- How can I reduce my loan tenure?\n- What's the best compounding frequency for FD?"
            }]);
        }
    }, [isOpen, messages.length]);

    const getAIResponse = useCallback(async (userMessage: string): Promise<string> => {
        // Simulate thinking delay
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

        const lowerMessage = userMessage.toLowerCase();

        // Context-aware responses
        if (lowerMessage.includes('prepay') || lowerMessage.includes('prepayment')) {
            return "🎯 **Prepayment Analysis**\n\nPrepaying your loan is often a smart choice if:\n- Your loan interest rate > Expected FD returns (after tax)\n- You have emergency funds secured\n- Prepayment penalty is minimal (<1-2%)\n\n**Pro tip**: Prepay aggressively in the first half of your loan tenure when interest component is highest!\n\nUse the **Compare** tab to see exact savings between prepayment scenarios and FD investment.";
        }

        if (lowerMessage.includes('fd') || lowerMessage.includes('fixed deposit')) {
            return "💰 **FD Investment Tips**\n\n1. **Quarterly compounding** usually offers the best balance of returns and liquidity\n2. Create an **FD ladder** with different maturities\n3. Consider **tax-saving FDs** for 80C benefits (5-year lock-in)\n4. Real returns = FD rate - Inflation - Tax\n\n**Example**: A 7% FD with 30% tax and 6% inflation gives ~(-1.1)% real returns!";
        }

        if (lowerMessage.includes('compare') || lowerMessage.includes('better') || lowerMessage.includes('should i')) {
            return "📊 **Loan Prepayment vs FD Investment**\n\n**Prepay if:**\n- Loan rate > FD rate (after tax)\n- You want guaranteed debt reduction\n- Peace of mind from being debt-free\n\n**Invest in FD if:**\n- FD returns > Loan rate (rare)\n- You need liquidity\n- You're claiming full tax benefits on home loan\n\n👉 Use our **Compare** page for a detailed scenario analysis!";
        }

        if (lowerMessage.includes('emi') || lowerMessage.includes('monthly payment')) {
            return "📅 **Understanding EMI**\n\nEMI = P × r × (1+r)^n / ((1+r)^n - 1)\n\nWhere:\n- P = Principal amount\n- r = Monthly interest rate\n- n = Total months\n\n**Key insight**: In early months, ~70-80% of EMI goes to interest! This is why early prepayments are so powerful.";
        }

        if (lowerMessage.includes('save') || lowerMessage.includes('saving')) {
            return "💡 **Maximize Your Savings**\n\n1. **Extra €100/month** can reduce a 20-year loan by 3-4 years\n2. **Annual bonus prepayment** creates compounding savings\n3. **Round up EMI** to nearest thousand for easy savings\n4. **Bi-weekly payments** instead of monthly can save months\n\nCheck Scenario C (Aggressive) for exact calculations!";
        }

        // Random insight if no specific match
        const randomInsight = financialInsights[Math.floor(Math.random() * financialInsights.length)];
        return randomInsight + "\n\n*Feel free to ask me specific questions about your loan or FD calculations!*";
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        try {
            const response = await getAIResponse(userMessage);
            setMessages(prev => [...prev, { role: 'assistant', content: response }]);
        } catch {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "I apologize, but I couldn't process your request. Please try again!"
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-20 right-4 md:bottom-6 md:right-6 w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg hover:shadow-xl flex items-center justify-center pulse-glow z-40 transition-transform hover:scale-110"
                aria-label="Open AI Assistant"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
            </button>

            {/* Chat Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="w-full max-w-lg bg-white rounded-t-3xl md:rounded-3xl shadow-2xl max-h-[80vh] flex flex-col overflow-hidden animate-slide-up">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-semibold">AI Financial Assistant</h3>
                                    <p className="text-xs text-white/80">Powered by local AI</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.map((msg, idx) => (
                                <div
                                    key={idx}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[85%] p-3 rounded-2xl ${msg.role === 'user'
                                                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-br-md'
                                                : 'bg-gray-100 text-gray-800 rounded-bl-md'
                                            }`}
                                    >
                                        <div className="text-sm whitespace-pre-wrap" dangerouslySetInnerHTML={{
                                            __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>')
                                        }} />
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-gray-100 p-3 rounded-2xl rounded-bl-md">
                                        <div className="flex gap-1">
                                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input */}
                        <form onSubmit={handleSubmit} className="p-4 border-t bg-gray-50">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Ask about loan strategies, FD, savings..."
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    disabled={isLoading}
                                />
                                <button
                                    type="submit"
                                    disabled={isLoading || !input.trim()}
                                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-shadow"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
        </>
    );
}

export default AIInsights;
