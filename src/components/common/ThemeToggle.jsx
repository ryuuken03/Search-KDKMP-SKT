import React from 'react';
import { APP_TEXT } from '../../config/constants';
import { IconMoon, IconSun } from './Icons';

export default function ThemeToggle({ isDark, onToggle }) {
  return (
    <button
      type="button"
      className={`theme-switch ${isDark ? 'theme-switch--dark' : ''}`}
      onClick={onToggle}
      aria-label={isDark ? APP_TEXT.MODE_LIGHT : APP_TEXT.MODE_DARK}
      title={isDark ? APP_TEXT.MODE_LIGHT : APP_TEXT.MODE_DARK}
    >
      <span className="theme-switch__thumb">
        {isDark ? <IconMoon className="theme-switch__icon" /> : <IconSun className="theme-switch__icon" />}
      </span>
    </button>
  );
}
