import { X, Clock, Moon, Sun, Coffee, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SnoozeOption {
  label: string;
  minutes: number;
  icon: React.ReactNode;
  description?: string;
}

interface SnoozeModalProps {
  onSelect: (minutes: number) => void;
  onClose: () => void;
}

// IST offset
const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

// Get current hour in IST
const getCurrentHourIST = (): number => {
  const now = new Date();
  const istTime = new Date(now.getTime() + IST_OFFSET_MS + now.getTimezoneOffset() * 60000);
  return istTime.getHours();
};

// Calculate minutes until a specific IST hour
const minutesUntilHour = (targetHour: number, nextDay: boolean = false): number => {
  const now = new Date();
  const istTime = new Date(now.getTime() + IST_OFFSET_MS + now.getTimezoneOffset() * 60000);
  const currentHour = istTime.getHours();
  const currentMinute = istTime.getMinutes();
  
  let hoursUntil = targetHour - currentHour;
  if (hoursUntil <= 0 || nextDay) hoursUntil += 24;
  
  return hoursUntil * 60 - currentMinute;
};

// Get smart snooze options based on current time
const getSmartSnoozeOptions = (): SnoozeOption[] => {
  const currentHour = getCurrentHourIST();
  const options: SnoozeOption[] = [];

  // Quick snooze options
  options.push({
    label: '10 minutes',
    minutes: 10,
    icon: <Clock className="w-4 h-4" />,
  });

  options.push({
    label: '30 minutes',
    minutes: 30,
    icon: <Clock className="w-4 h-4" />,
  });

  options.push({
    label: '1 hour',
    minutes: 60,
    icon: <Clock className="w-4 h-4" />,
  });

  // Context-aware options based on time of day
  if (currentHour >= 6 && currentHour < 12) {
    // Morning - offer afternoon and evening
    options.push({
      label: 'This afternoon',
      minutes: minutesUntilHour(14),
      icon: <Sun className="w-4 h-4" />,
      description: '2:00 PM',
    });
    options.push({
      label: 'This evening',
      minutes: minutesUntilHour(18),
      icon: <Moon className="w-4 h-4" />,
      description: '6:00 PM',
    });
  } else if (currentHour >= 12 && currentHour < 17) {
    // Afternoon - offer evening and tonight
    options.push({
      label: 'This evening',
      minutes: minutesUntilHour(18),
      icon: <Moon className="w-4 h-4" />,
      description: '6:00 PM',
    });
    options.push({
      label: 'Tonight',
      minutes: minutesUntilHour(21),
      icon: <Moon className="w-4 h-4" />,
      description: '9:00 PM',
    });
  } else if (currentHour >= 17 && currentHour < 21) {
    // Evening - offer tonight and tomorrow morning
    options.push({
      label: 'Tonight',
      minutes: minutesUntilHour(21),
      icon: <Moon className="w-4 h-4" />,
      description: '9:00 PM',
    });
  }

  // Always offer tomorrow morning
  options.push({
    label: 'Tomorrow morning',
    minutes: minutesUntilHour(9, true),
    icon: <Coffee className="w-4 h-4" />,
    description: '9:00 AM',
  });

  // Offer next week for less urgent tasks
  options.push({
    label: 'Next week',
    minutes: 60 * 24 * 7,
    icon: <Calendar className="w-4 h-4" />,
    description: 'Same time',
  });

  return options;
};

export const SnoozeModal = ({ onSelect, onClose }: SnoozeModalProps) => {
  const snoozeOptions = getSmartSnoozeOptions();

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-card w-full max-w-lg mx-0 sm:mx-4 rounded-t-2xl sm:rounded-2xl shadow-2xl border border-border p-5 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-warning" />
            <h2 className="text-lg font-semibold text-foreground">Snooze until</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-secondary transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="space-y-2">
          {snoozeOptions.map((option, index) => (
            <button
              key={index}
              onClick={() => onSelect(option.minutes)}
              className={cn(
                "w-full p-4 rounded-xl text-left transition-all flex items-center gap-3",
                "bg-secondary/50 hover:bg-secondary active:scale-[0.98]"
              )}
            >
              <span className="text-muted-foreground">{option.icon}</span>
              <div className="flex-1">
                <span className="font-medium text-foreground">{option.label}</span>
                {option.description && (
                  <span className="text-sm text-muted-foreground ml-2">
                    ({option.description})
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
