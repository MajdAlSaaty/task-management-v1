import { useEffect } from 'react';

const ThemeManager = () => {
  useEffect(() => {
    // Default to light theme
    const theme = 'light';
    const html = document.documentElement;
    html.classList.remove('theme-light', 'theme-dark');
    html.classList.add(`theme-${theme}`);
    html.setAttribute('data-theme', theme);
  }, []);

  return null;
};

export default ThemeManager;