import { CreditCard } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';

const Billing = () => {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Billing</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your subscription and billing details</p>
      </div>

      <EmptyState
        icon={CreditCard}
        title="No active subscription"
        description="You're currently on the free plan. Upgrade to unlock more locations, auto-replies, and premium features."
        actionLabel="View Plans"
        onAction={() => {}}
      />
    </div>
  );
};

export default Billing;
