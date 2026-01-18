import { Check, Clock, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BulkActionsBarProps {
  selectedCount: number;
  onComplete: () => void;
  onSnooze: () => void;
  onDelete: () => void;
  onClearSelection: () => void;
}

export const BulkActionsBar = ({
  selectedCount,
  onComplete,
  onSnooze,
  onDelete,
  onClearSelection,
}: BulkActionsBarProps) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-20 left-0 right-0 px-4 pb-2 z-50">
      <div className="max-w-lg mx-auto bg-card border border-border rounded-2xl shadow-lg p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClearSelection}
              className="h-9 w-9 rounded-xl"
            >
              <X className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium text-foreground">
              {selectedCount} selected
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onComplete}
              className="rounded-xl gap-1"
            >
              <Check className="w-4 h-4" />
              Done
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onSnooze}
              className="rounded-xl gap-1"
            >
              <Clock className="w-4 h-4" />
              Snooze
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
              className="rounded-xl gap-1 text-destructive border-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
