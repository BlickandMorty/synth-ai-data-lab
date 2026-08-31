'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  FlaskConical, 
  Layers, 
  Tag, 
  BookOpen, 
  Settings, 
  LayoutDashboard,
  Cpu,
  Database,
  ClipboardCheck,
  Sparkles
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Data Lab', href: '/lab', icon: FlaskConical },
  { name: 'Annotation Studio', href: '/annotate', icon: Tag },
  { name: 'Packet Explorer', href: '/packets', icon: Layers },
  { name: 'Dataset Review', href: '/datasets', icon: ClipboardCheck },
  { name: 'Experiment Journal', href: '/experiments', icon: BookOpen },
  { name: 'Model & System Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-sidebar-border bg-sidebar flex flex-col justify-between h-screen sticky top-0 select-none z-30 transition-colors">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-sidebar-border/60">
          <div className="w-8 h-8 rounded-lg bg-[#C4956A] flex items-center justify-center text-black font-bold shadow-sm">
            <Sparkles className="w-4 h-4 text-black" />
          </div>
          <div>
            <span className="font-bold text-sm tracking-wide text-foreground">SYNTH</span>
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">LAB v1.0</span>
            </div>
          </div>
        </div>

        {/* Main Nav */}
        <div className="px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider font-mono">
            Platform Engine
          </div>
          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all group",
                  isActive
                    ? "bg-sidebar-accent text-foreground shadow-sm font-semibold border border-sidebar-border/40"
                    : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
                )}
              >
                <Icon className={cn(
                  "w-4 h-4 transition-colors",
                  isActive ? "text-[#C4956A]" : "text-muted-foreground group-hover:text-foreground"
                )} />
                <span>{item.name}</span>
                {item.name === 'Data Lab' && (
                  <span className="ml-auto text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#C4956A]/10 text-[#C4956A] font-bold border border-[#C4956A]/20">
                    LIVE
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Footer System Status */}
      <div className="p-4 border-t border-sidebar-border/60">
        <div className="p-3 rounded-lg bg-card/60 border border-border/40 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-[#C4956A]" />
              Local Inference
            </span>
              <span className="font-mono text-[10px] font-medium text-muted-foreground">CHECK SETTINGS</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-[#C4956A]" />
              Packet Ledger
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">SQLite v3</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
