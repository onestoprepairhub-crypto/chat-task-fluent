import { useState } from 'react';
import { Bell, Clock, Moon, Smartphone } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

interface SettingsState {
  dailySummary: boolean;
  defaultSnooze: number;
  quietHoursEnabled: boolean;
  quietStart: string;
  quietEnd: string;
}

export const SettingsView = () => {
  const [settings, setSettings] = useState<SettingsState>({
    dailySummary: true,
    defaultSnooze: 30,
    quietHoursEnabled: false,
    quietStart: '22:00',
    quietEnd: '07:00',
  });

  const snoozeOptions = [10, 30, 60];

  return (
    <div className="px-4 pb-24 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-1">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Customize your notification preferences
        </p>
      </div>

      {/* Notifications Section */}
      <div className="glass-card p-4 space-y-4">
        <h2 className="font-semibold text-foreground flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          Notifications
        </h2>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-foreground">Daily Summary</p>
            <p className="text-sm text-muted-foreground">
              Get a morning overview of your tasks
            </p>
          </div>
          <Switch
            checked={settings.dailySummary}
            onCheckedChange={(checked) =>
              setSettings((s) => ({ ...s, dailySummary: checked }))
            }
          />
        </div>
      </div>

      {/* Snooze Section */}
      <div className="glass-card p-4 space-y-4">
        <h2 className="font-semibold text-foreground flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Default Snooze Duration
        </h2>

        <div className="flex gap-2">
          {snoozeOptions.map((minutes) => (
            <button
              key={minutes}
              onClick={() => setSettings((s) => ({ ...s, defaultSnooze: minutes }))}
              className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                settings.defaultSnooze === minutes
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {minutes} min
            </button>
          ))}
        </div>
      </div>

      {/* Quiet Hours Section */}
      <div className="glass-card p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Moon className="w-5 h-5 text-primary" />
            Quiet Hours
          </h2>
          <Switch
            checked={settings.quietHoursEnabled}
            onCheckedChange={(checked) =>
              setSettings((s) => ({ ...s, quietHoursEnabled: checked }))
            }
          />
        </div>

        {settings.quietHoursEnabled && (
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground mb-1 block">From</label>
              <input
                type="time"
                value={settings.quietStart}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, quietStart: e.target.value }))
                }
                className="w-full input-chat text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-muted-foreground mb-1 block">To</label>
              <input
                type="time"
                value={settings.quietEnd}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, quietEnd: e.target.value }))
                }
                className="w-full input-chat text-sm"
              />
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          No notifications will be sent during quiet hours
        </p>
      </div>

      {/* About Section */}
      <div className="glass-card p-4 space-y-3">
        <h2 className="font-semibold text-foreground flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-primary" />
          About
        </h2>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Version</span>
            <span className="text-foreground">1.0.0</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Push Notifications</span>
            <span className="text-success">Enabled</span>
          </div>
        </div>
      </div>
    </div>
  );
};
