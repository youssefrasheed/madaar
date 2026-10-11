import React from 'react';

/**
 * MadaarLogo Component
 * Official Brand Identity for «مَـدَار | MADAAR»
 * 
 * Powered by User's Master Vector SVG Exports:
 * - Dark Mode: /logo-01.svg (White text + Electric Cyan Slogan on Dark background)
 * - Light Mode: /Logo.svg (Dark text + Electric Cyan Slogan on Light background)
 */
export default function MadaarLogo({
  size = 'md',
  showText = true,
  isRTL = true,
  className = '',
  light = false,
}) {
  const sizeMap = {
    sm: {
      height: 'h-10',
      iconOnly: 'w-10 h-10',
    },
    md: {
      height: 'h-14',
      iconOnly: 'w-14 h-14',
    },
    sidebar: {
      height: 'h-[76px]', // Prominent size for sidebar header
      iconOnly: 'w-[76px] h-[76px]',
    },
    lg: {
      height: 'h-20',
      iconOnly: 'w-20 h-20',
    },
    xl: {
      height: 'h-24',
      iconOnly: 'w-24 h-24',
    },
  };

  const current = sizeMap[size] || sizeMap.md;

  if (!showText) {
    return (
      <div className={`${current.iconOnly} rounded-2xl overflow-hidden shrink-0 mx-auto ${className}`}>
        <img
          src="/favicon.svg"
          alt="مَـدَار | MADAAR"
          className="w-full h-full object-contain"
          onError={(e) => {
            e.target.src = '/logo.png';
          }}
        />
      </div>
    );
  }

  // Use user's exact master SVG files
  const logoSrc = light ? '/Logo.svg' : '/logo-01.svg';

  return (
    <div className={`inline-flex items-center justify-center select-none shrink-0 ${className}`}>
      <img
        src={logoSrc}
        alt="مَـدَار | MADAAR — منصاتك بنفس المدار"
        className={`${current.height} w-auto object-contain transition-transform duration-200 hover:scale-[1.02] mx-auto`}
      />
    </div>
  );
}
