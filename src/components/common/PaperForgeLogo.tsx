import React from 'react';

interface PaperForgeLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon';
  theme?: 'light' | 'dark' | 'auto';
  className?: string;
  subtitle?: string;
}

const SIZE_MAP = {
  sm: { icon: 20, font: 15, height: 22 },
  md: { icon: 26, font: 18, height: 28 },
  lg: { icon: 34, font: 22, height: 36 },
  xl: { icon: 48, font: 30, height: 50 },
};

export const PaperForgeLogo: React.FC<PaperForgeLogoProps> = ({
  size = 'md',
  variant = 'full',
  theme = 'auto',
  className = '',
  subtitle,
}) => {
  const dimensions = SIZE_MAP[size] || SIZE_MAP.md;

  return (
    <div
      className={`paperforge-logo paperforge-logo-${size} ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: size === 'sm' ? 7 : size === 'lg' ? 11 : size === 'xl' ? 14 : 9,
        userSelect: 'none',
        lineHeight: 1,
      }}
      aria-label="PaperForge"
    >
      {/* Precision Scalable Vector Icon */}
      <svg
        width={dimensions.icon}
        height={dimensions.icon}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        <defs>
          <linearGradient id="pfDocGrad" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#4f46e5" />
            <stop offset="100%" stopColor="#3730a3" />
          </linearGradient>
          <linearGradient id="pfFoldGrad" x1="20" y1="4" x2="28" y2="12" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#a5b4fc" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
          <linearGradient id="pfForgeFlame" x1="16" y1="20" x2="16" y2="28" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
        </defs>

        {/* Back drop shadow layer */}
        <rect x="5" y="4" width="22" height="24" rx="3.5" fill="#1e1b4b" opacity="0.15" />

        {/* Main Document Body */}
        <path
          d="M6 5.5C6 4.67157 6.67157 4 7.5 4H20L26 10V26.5C26 27.3284 25.3284 28 24.5 28H7.5C6.67157 28 6 27.3284 6 26.5V5.5Z"
          fill="url(#pfDocGrad)"
        />

        {/* 3D Folded Page Corner */}
        <path
          d="M20 4L26 10H21.5C20.6716 10 20 9.32843 20 8.5V4Z"
          fill="url(#pfFoldGrad)"
        />

        {/* Embossed Document Content Lines */}
        <path d="M10 14H18" stroke="#c7d2fe" strokeWidth="1.75" strokeLinecap="round" opacity="0.9" />
        <path d="M10 18H22" stroke="#c7d2fe" strokeWidth="1.75" strokeLinecap="round" opacity="0.9" />
        <path d="M10 22H16" stroke="#c7d2fe" strokeWidth="1.75" strokeLinecap="round" opacity="0.9" />

        {/* The "Forge" Ember Spark / Craft Crease in bottom right */}
        <path
          d="M20 22C20 20.2 21.8 19.5 21.8 18C22.6 19.5 24 20.2 24 22C24 23.3 23 24 21.8 24C20.6 24 20 23.3 20 22Z"
          fill="url(#pfForgeFlame)"
        />
        <circle cx="23.5" cy="18" r="0.75" fill="#fde68a" />
      </svg>

      {/* Wordmark */}
      {variant === 'full' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              letterSpacing: '-0.4px',
              fontFamily: 'var(--font-sans)',
              fontWeight: 700,
              fontSize: dimensions.font,
            }}
          >
            <span
              style={{
                color:
                  theme === 'dark'
                    ? '#f4f4f6'
                    : theme === 'light'
                    ? '#09090b'
                    : 'var(--text-primary)',
                transition: 'color 0.15s ease',
              }}
            >
              Paper
            </span>
            <span
              style={{
                background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #f59e0b 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginLeft: 1,
              }}
            >
              Forge
            </span>
          </div>

          {subtitle && (
            <span
              style={{
                fontSize: 9.5,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                color: 'var(--text-muted)',
              }}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
