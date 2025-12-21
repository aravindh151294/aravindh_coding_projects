'use client';

import dynamic from 'next/dynamic';

const AIInsightsComponent = dynamic(
  () => import('@/components/AIInsights').then(mod => mod.AIInsights),
  { ssr: false }
);

export function AIInsightsWrapper() {
  return <AIInsightsComponent />;
}
