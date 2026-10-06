'use client';
import {useEffect, useState} from 'react';
import {Moon, Sun} from 'lucide-react';
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
  const next = theme === 'dark' ? 'light' : 'dark';
  return <button className="theme-toggle" aria-label={`Switch to ${next === 'light' ? 'day' : 'night'} mode`} title={`Switch to ${next === 'light' ? 'day' : 'night'} mode`} onClick={() => {
    apply(next);
    try { localStorage.setItem(themeStorageKey, next); } catch { /* A blocked preference store must not block the page. */ }
  }}>{theme === 'dark' ? <Sun size={17}/> : <Moon size={17}/>}<span>{theme === 'dark' ? 'Day mode' : 'Night mode'}</span></button>;
}
