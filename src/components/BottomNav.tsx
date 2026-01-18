import { Home, CheckCircle2, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

export type NavTab = 'home' | 'completed' | 'settings';

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export const BottomNav = ({ activeTab, onTabChange }: BottomNavProps) => {
  const navItems: { id: NavTab; label: string; icon: typeof Home }[] = [
    { id: 'home', label: 'Tasks', icon: Home },
    { id: 'completed', label: 'Done', icon: CheckCircle2 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="bottom-nav">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={cn('nav-item', activeTab === id && 'active')}
          >
            <Icon className="w-6 h-6 mb-0.5" />
            <span className="text-xs font-medium">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};
