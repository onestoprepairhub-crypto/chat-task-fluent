import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface StatCardProps {
  label: string;
  value: string | number | null;
  icon: LucideIcon;
  loading?: boolean;
}

export const StatCard = ({ label, value, icon: Icon, loading }: StatCardProps) => (
  <Card>
    <CardContent className="flex items-center gap-4 p-5">
      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground truncate">{label}</p>
        {loading ? (
          <Skeleton className="h-7 w-16 mt-1" />
        ) : (
          <p className="text-2xl font-bold text-foreground">{value ?? '—'}</p>
        )}
      </div>
    </CardContent>
  </Card>
);
