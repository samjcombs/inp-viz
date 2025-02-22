'use client';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const SurveyVisualization = dynamic(() => import('@/components/viz'), { ssr: false });

export default function Home() {
  const [currentSurvey, setCurrentSurvey] = useState<'opening' | 'closing'>('opening');

  useEffect(() => {
    const title = `INP Survey Results: ${currentSurvey === 'opening' ? 'Black History Retreat' : 'Black Futures Retreat'}`;
    document.title = title;
  }, [currentSurvey]);

  return (
    <main className="min-h-screen p-4">
      <SurveyVisualization onSurveyChange={setCurrentSurvey} />
    </main>
  );
}
