'use client';
import {useEffect, useState} from 'react';
import {Moon, Sun} from 'lucide-react';
import {Switch} from 'radix-ui';
import {normalizeTheme, themeStorageKey, type Theme} from '../lib/theme';

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('dark');
  const apply = (next: Theme) => {
    document.documentElement.dataset.theme = next;
    document.documentElement.classList.toggle('dark', next === 'dark');
    setTheme(next);
  };
  useEffect(() => {
    setTheme(normalizeTheme(document.documentElement.dataset.theme));
    const sync = (event: StorageEvent) => {
      if (event.key === themeStorageKey || event.key === null) apply(normalizeTheme(event.newValue));
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  return <div className="theme-control">
    <span className="theme-mode" data-active={theme === 'light'} aria-hidden="true"><Sun size={16}/><span className="theme-mode-label">Day</span></span>
    <Switch.Root className="theme-switch" data-slot="switch" aria-label="Night mode" checked={theme === 'dark'} onCheckedChange={(checked) => {
      const next = checked ? 'dark' : 'light';
      apply(next);
      try { localStorage.setItem(themeStorageKey, next); } catch { /* A blocked preference store must not block the page. */ }
    }}><Switch.Thumb data-slot="switch-thumb"/></Switch.Root>
    <span className="theme-mode" data-active={theme === 'dark'} aria-hidden="true"><Moon size={16}/><span className="theme-mode-label">Night</span></span>
  </div>;
}
