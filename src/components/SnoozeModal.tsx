import { X, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SnoozeOption {
  label: string;
  minutes: number;
}

interface SnoozeModalProps {
  onSelect: (minutes: number) => void;
  onClose: () => void;
}

const snoozeOptions: SnoozeOption[] = [
  { label: '10 minutes', minutes: 10 },
  { label: '30 minutes', minutes: 30 },
  { label: '1 hour', minutes: 60 },
  { label: '3 hours', minutes: 180 },
  { label: 'Tomorrow morning', minutes: 60 * 12 },
];

export const SnoozeModal = ({ onSelect, onClose }: SnoozeModalProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="glass-card w-full max-w-lg mx-4 mb-4 p-5 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-warning" />
            <h2 className="text-lg font-semibold text-foreground">Snooze for</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-secondary transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="space-y-2">
          {snoozeOptions.map((option) => (
            <button
              key={option.minutes}
              onClick={() => onSelect(option.minutes)}
              className={cn(
                "w-full p-4 rounded-xl text-left transition-all",
                "bg-secondary/50 hover:bg-secondary active:scale-[0.98]"
              )}
            >
              <span className="font-medium text-foreground">{option.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
