import { useState } from 'react';
import { MessageSquare, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmptyState } from '@/components/EmptyState';
import { ReviewReplyPanel } from '@/components/ReviewReplyPanel';

const Reviews = () => {
  const reviews: any[] = []; // real API data
  const [selectedReview, setSelectedReview] = useState<any>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reviews</h1>
        <p className="text-sm text-muted-foreground mt-1">Monitor and respond to customer reviews</p>
      </div>

      {reviews.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search reviews…" className="pl-9" />
          </div>
          <Select>
            <SelectTrigger className="w-[160px]">
              <Filter className="w-4 h-4 mr-1.5" />
              <SelectValue placeholder="All Ratings" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ratings</SelectItem>
              <SelectItem value="5">5 Stars</SelectItem>
              <SelectItem value="4">4 Stars</SelectItem>
              <SelectItem value="3">3 Stars</SelectItem>
              <SelectItem value="2">2 Stars</SelectItem>
              <SelectItem value="1">1 Star</SelectItem>
            </SelectContent>
          </Select>
          <Select>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Reply Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="replied">Replied</SelectItem>
              <SelectItem value="unreplied">Not Replied</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {reviews.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No reviews found"
          description="Connect a location to start seeing reviews here. Once connected, new reviews will appear automatically."
        />
      ) : null}

      <ReviewReplyPanel review={selectedReview} open={!!selectedReview} onClose={() => setSelectedReview(null)} />
    </div>
  );
};

export default Reviews;
