'use client';
export type ThemePref = 'light' | 'dark' | 'system';
export const getThemePref = (): ThemePref => (typeof localStorage !== 'undefined' && (localStorage.getItem('ss-admin-theme') as ThemePref)) || 'system';
export function setThemePref(t: ThemePref) {
  localStorage.setItem('ss-admin-theme', t);
  const dark = t === 'dark' || (t === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.getElementById('admin-root')?.setAttribute('data-theme', dark ? 'dark' : 'light');
}
