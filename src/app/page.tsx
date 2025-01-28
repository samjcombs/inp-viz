'use client';
import dynamic from 'next/dynamic';

const SurveyVisualization = dynamic(() => import('@/components/viz'), { ssr: false });

export default function Home() {
  return (
    <main className="min-h-screen p-4">
      <SurveyVisualization />
    </main>
  );
}
