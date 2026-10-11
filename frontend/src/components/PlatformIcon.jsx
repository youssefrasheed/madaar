import React from 'react';

// Modern SVG platform icons with high visual fidelity and platform branding
export const PLATFORM_META = {
  facebook: {
    name: 'Facebook',
    color: '#1877F2',
    bgClass: 'bg-blue-600 text-white',
    badgeClass: 'bg-blue-50 text-blue-600 border border-blue-200',
    characterLimit: 63206,
  },
  instagram: {
    name: 'Instagram',
    color: '#E1306C',
    bgClass: 'bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white',
    badgeClass: 'bg-pink-50 text-pink-600 border border-pink-200',
    characterLimit: 2200,
  },
  twitter: {
    name: 'X (Twitter)',
    color: '#000000',
    bgClass: 'bg-black text-white',
    badgeClass: 'bg-slate-100 text-slate-900 border border-slate-300',
    characterLimit: 280,
  },
  linkedin: {
    name: 'LinkedIn',
    color: '#0A66C2',
    bgClass: 'bg-sky-700 text-white',
    badgeClass: 'bg-sky-50 text-sky-700 border border-sky-200',
    characterLimit: 3000,
  },
  tiktok: {
    name: 'TikTok',
    color: '#010101',
    bgClass: 'bg-black text-white shadow-cyan-500/20',
    badgeClass: 'bg-zinc-100 text-zinc-900 border border-zinc-300',
    characterLimit: 2200,
  },
  youtube: {
    name: 'YouTube',
    color: '#FF0000',
    bgClass: 'bg-red-600 text-white',
    badgeClass: 'bg-red-50 text-red-600 border border-red-200',
    characterLimit: 5000,
  },
  snapchat: {
    name: 'Snapchat',
    color: '#FFFC00',
    bgClass: 'bg-amber-300 text-black',
    badgeClass: 'bg-amber-50 text-amber-800 border border-amber-300',
    characterLimit: 250,
  },
};

export default function PlatformIcon({ platform, size = 'md', showBg = true, className = '' }) {
  const meta = PLATFORM_META[platform?.toLowerCase()] || {
    name: platform,
    color: '#64748b',
    bgClass: 'bg-slate-500 text-white',
    badgeClass: 'bg-slate-100 text-slate-700',
  };

  const sizeClasses = {
    xs: 'w-5 h-5 text-xs',
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-11 h-11 text-base',
    xl: 'w-14 h-14 text-xl',
  };

  const iconSizes = {
    xs: 12,
    sm: 15,
    md: 18,
    lg: 22,
    xl: 28,
  };

  const isCurrentSize = iconSizes[size] || 18;

  const renderSvg = () => {
    switch (platform?.toLowerCase()) {
      case 'facebook':
        return (
          <svg width={isCurrentSize} height={isCurrentSize} viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
        );
      case 'instagram':
        return (
          <svg width={isCurrentSize} height={isCurrentSize} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
          </svg>
        );
      case 'twitter':
        return (
          <svg width={isCurrentSize} height={isCurrentSize} viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        );
      case 'linkedin':
        return (
          <svg width={isCurrentSize} height={isCurrentSize} viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
          </svg>
        );
      case 'tiktok':
        return (
          <svg width={isCurrentSize} height={isCurrentSize} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.2 1.61.16 1.61 1.47 2.89 3.08 2.94 1.25.07 2.48-.56 3.12-1.63.43-.66.6-1.46.59-2.25.03-4.83.01-9.66.01-14.49z" />
          </svg>
        );
      case 'youtube':
        return (
          <svg width={isCurrentSize} height={isCurrentSize} viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
          </svg>
        );
      case 'snapchat':
        return (
          <svg width={isCurrentSize} height={isCurrentSize} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.016 2.004c-3.959 0-6.19 2.766-6.19 6.017 0 .894.276 2.378.854 3.414.248.442.276.677.106.91-.252.345-.884.724-1.579.914-.525.143-.762.333-.767.587-.006.312.448.552.923.633.978.167 1.879-.115 2.148.448.163.342-.258 1.157-.96 1.834-.41.398-.597.74-.537 1.002.108.473.845.694 2.112.633.827-.04 1.543.238 2.062.871.745.908 1.455.938 1.828.938.375 0 1.084-.03 1.829-.938.52-.633 1.235-.911 2.062-.871 1.267.061 2.004-.16 2.112-.633.06-.262-.127-.604-.537-1.002-.702-.677-1.123-1.492-.96-1.834.269-.563 1.17-.281 2.148-.448.475-.081.929-.321.923-.633-.005-.254-.242-.444-.767-.587-.695-.19-1.327-.569-1.579-.914-.17-.233-.142-.468.106-.91.578-1.036.854-2.52.854-3.414 0-3.251-2.231-6.017-6.19-6.017z" />
          </svg>
        );
      default:
        return (
          <span className="font-bold text-xs uppercase">
            {platform ? platform.slice(0, 2) : '??'}
          </span>
        );
    }
  };

  if (!showBg) {
    return (
      <span className={`inline-flex items-center justify-center ${className}`} title={meta.name}>
        {renderSvg()}
      </span>
    );
  }

  return (
    <div
      className={`inline-flex items-center justify-center rounded-xl font-semibold shadow-sm transition-transform duration-150 ${sizeClasses[size] || sizeClasses.md} ${meta.bgClass} ${className}`}
      title={meta.name}
    >
      {renderSvg()}
    </div>
  );
}
