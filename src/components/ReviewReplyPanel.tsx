import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, Sparkles, Save, Send } from 'lucide-react';
import { useState } from 'react';

interface ReviewReplyPanelProps {
  review: any;
  open: boolean;
  onClose: () => void;
}

export const ReviewReplyPanel = ({ review, open, onClose }: ReviewReplyPanelProps) => {
  const [reply, setReply] = useState('');

  if (!review) return null;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader>
          <SheetTitle>Reply to Review</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto space-y-5 py-4">
          {/* Review details */}
          <div className="bg-muted rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`w-4 h-4 ${i < (review?.rating ?? 0) ? 'text-warning fill-warning' : 'text-muted-foreground'}`} />
              ))}
            </div>
            <p className="font-medium text-foreground">{review?.author ?? 'Reviewer'}</p>
            <p className="text-sm text-muted-foreground">{review?.text ?? ''}</p>
          </div>

          {/* Reply input */}
          <div className="space-y-3">
            <Textarea
              placeholder="Write your reply…"
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              className="min-h-[120px] resize-none"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-4 border-t border-border">
          <Button variant="outline" className="w-full justify-center">
            <Sparkles className="w-4 h-4 mr-1.5" /> Generate AI Reply
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1">
              <Save className="w-4 h-4 mr-1.5" /> Save Draft
            </Button>
            <Button className="flex-1">
              <Send className="w-4 h-4 mr-1.5" /> Post Reply
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
