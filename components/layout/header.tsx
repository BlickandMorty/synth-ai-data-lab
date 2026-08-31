'use client';

import { useTheme } from 'next-themes';
import { Sun, Moon, Sparkles, Terminal, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

export function Header() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [localStatus, setLocalStatus] = useState<'checking' | 'connected' | 'simulator'>('checking');

  useEffect(() => {
    setMounted(true);
    fetch('/api/health').then((response) => response.json()).then((data) => {
      setLocalStatus(data?.ollama?.running ? 'connected' : 'simulator');
    }).catch(() => setLocalStatus('simulator'));
  }, []);

  return (
    <header className="h-16 border-b border-border/60 bg-background/80 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between px-8">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-secondary/80 border border-border/60 text-xs font-mono">
          <Activity className="w-3.5 h-3.5 text-[#C4956A] animate-pulse" />
          <span className="text-muted-foreground">LOCAL ENGINE:</span>
          <span className="font-semibold text-foreground">{localStatus === 'connected' ? 'OLLAMA READY' : localStatus === 'checking' ? 'CHECKING' : 'SIMULATOR ONLY'}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {mounted && (
          <Button
            variant="ghost"
            size="icon"
            className="w-9 h-9 rounded-lg"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-[#C4956A]" />
            ) : (
              <Moon className="w-4 h-4 text-foreground" />
            )}
          </Button>
        )}
      </div>
    </header>
  );
}
