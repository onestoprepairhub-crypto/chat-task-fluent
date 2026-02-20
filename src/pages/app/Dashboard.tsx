import { MapPin, Star, MessageSquareOff, BarChart3 } from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { EmptyState } from '@/components/EmptyState';

const Dashboard = () => {
  const hasData = false; // driven by real API state

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Overview of your review management</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Locations" value={hasData ? null : 0} icon={MapPin} />
        <StatCard label="Total Reviews" value={hasData ? null : 0} icon={Star} />
        <StatCard label="Unanswered" value={hasData ? null : 0} icon={MessageSquareOff} />
        <StatCard label="Avg. Rating" value={hasData ? null : '—'} icon={BarChart3} />
      </div>

      {!hasData && (
        <EmptyState
          icon={MapPin}
          title="No locations connected"
          description="Connect your Google Business Profile to start monitoring and replying to reviews."
          actionLabel="Connect Location"
          onAction={() => {}}
        />
      )}
    </div>
  );
};

export default Dashboard;
