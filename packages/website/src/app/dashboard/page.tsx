import { Navigation } from '@/components/marketing/Navigation';
import { DashboardContent } from '@/components/dashboard/DashboardContent';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function DashboardPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-surface-secondary pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-ink-primary">Analytics Dashboard</h1>
            <p className="text-ink-secondary mt-2">Real-time learning analytics from MCQMCP</p>
          </div>
          <DashboardContent />
        </div>
      </main>
    </>
  );
}
