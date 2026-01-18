import { useState, useEffect } from 'react';
import { Bell, Clock, Moon, Smartphone, LogOut, BellRing, Check, Share, Plus, Sun, Monitor } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/hooks/useNotifications';
import { useTheme } from '@/hooks/useTheme';

interface SettingsState {
  dailySummary: boolean;
  defaultSnooze: number;
  quietHoursEnabled: boolean;
  quietStart: string;
  quietEnd: string;
}

interface SettingsViewProps {
  onSignOut?: () => void;
}

export const SettingsView = ({ onSignOut }: SettingsViewProps) => {
  const [settings, setSettings] = useState<SettingsState>({
    dailySummary: true,
    defaultSnooze: 30,
    quietHoursEnabled: false,
    quietStart: '22:00',
    quietEnd: '07:00',
  });

  const { theme, setTheme } = useTheme();

  const { 
    isSupported, 
    isEnabled, 
    permissionStatus,
    requestPermission, 
    sendTestNotification,
    needsHomeScreenInstall,
    iosInfo,
  } = useNotifications();

  const snoozeOptions = [10, 30, 60];
  const themeOptions = [
    { value: 'light' as const, label: 'Light', icon: Sun },
    { value: 'dark' as const, label: 'Dark', icon: Moon },
    { value: 'system' as const, label: 'System', icon: Monitor },
  ];

  return (
    <div className="px-4 pb-24 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-1">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Customize your notification preferences
        </p>
      </div>

      {/* Push Notifications Section */}
      <div className="glass-card p-4 space-y-4">
        <h2 className="font-semibold text-foreground flex items-center gap-2">
          <BellRing className="w-5 h-5 text-primary" />
          Push Notifications
        </h2>

        {/* iOS Home Screen Installation Guide */}
        {needsHomeScreenInstall && (
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 space-y-3">
            <p className="text-sm font-medium text-foreground">
              📱 Add to Home Screen for Notifications
            </p>
            <p className="text-xs text-muted-foreground">
              iOS requires apps to be installed on your Home Screen to receive push notifications.
            </p>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">1</div>
                <span>Tap the <Share className="w-4 h-4 inline mx-1" /> Share button in Safari</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">2</div>
                <span>Scroll down and tap <Plus className="w-4 h-4 inline mx-1" /> "Add to Home Screen"</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">3</div>
                <span>Open the app from your Home Screen</span>
              </div>
            </div>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
              ⚠️ Note: Use Safari browser for this feature. Chrome on iOS doesn't support Home Screen apps.
            </p>
          </div>
        )}

        {/* iOS version too old */}
        {iosInfo?.isIOS && iosInfo.version < 16 && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4">
            <p className="text-sm text-destructive">
              iOS 16.4 or later is required for push notifications. Please update your device.
            </p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-foreground">Enable Notifications</p>
            <p className="text-sm text-muted-foreground">
              {isEnabled 
                ? 'Notifications are enabled' 
                : 'Get reminders on your device'}
            </p>
          </div>
          {isEnabled ? (
            <div className="flex items-center gap-2 text-success">
              <Check className="w-5 h-5" />
              <span className="text-sm font-medium">Enabled</span>
            </div>
          ) : (
            <Button
              onClick={requestPermission}
              size="sm"
              className="rounded-xl"
              disabled={!isSupported && !needsHomeScreenInstall}
            >
              {needsHomeScreenInstall ? 'How to Enable' : 'Enable'}
            </Button>
          )}
        </div>

        {isEnabled && (
          <Button
            onClick={sendTestNotification}
            variant="outline"
            size="sm"
            className="w-full rounded-xl"
          >
            Send Test Notification
          </Button>
        )}

        {!isSupported && !iosInfo?.isIOS && (
          <p className="text-xs text-muted-foreground">
            Push notifications are not supported in this browser.
          </p>
        )}
      </div>

      {/* Notifications Section */}
      <div className="glass-card p-4 space-y-4">
        <h2 className="font-semibold text-foreground flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          Notification Preferences
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

      {/* Theme Section */}
      <div className="glass-card p-4 space-y-4">
        <h2 className="font-semibold text-foreground flex items-center gap-2">
          <Sun className="w-5 h-5 text-primary" />
          Appearance
        </h2>

        <div className="flex gap-2">
          {themeOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                onClick={() => setTheme(option.value)}
                className={`flex-1 py-3 px-2 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  theme === option.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                <Icon className="w-4 h-4" />
                {option.label}
              </button>
            );
          })}
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
            <span className={isEnabled ? "text-success" : "text-muted-foreground"}>
              {isEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>
      </div>

      {/* Sign Out */}
      {onSignOut && (
        <Button
          onClick={onSignOut}
          variant="outline"
          className="w-full h-12 rounded-xl border-destructive text-destructive hover:bg-destructive/10"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      )}
    </div>
  );
};
