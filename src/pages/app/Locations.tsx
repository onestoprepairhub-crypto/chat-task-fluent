import { MapPin, Search, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/EmptyState';

const Locations = () => {
  const locations: any[] = []; // real API data

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Locations</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your business locations</p>
        </div>
        <Button><Plus className="w-4 h-4 mr-1.5" /> Add Location</Button>
      </div>

      {locations.length > 0 && (
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search locations…" className="pl-9" />
        </div>
      )}

      {locations.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No locations connected"
          description="Connect your Google Business Profile to import your business locations and start managing reviews."
          actionLabel="Connect Google Business"
          onAction={() => {}}
        />
      ) : null}
    </div>
  );
};

export default Locations;
