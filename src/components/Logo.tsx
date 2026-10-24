import React from 'react';
import Link from 'next/link';

interface LogoProps {
  href?: string;
  className?: string;
  iconOnly?: boolean;
}

export function Logo({ href = '/', className = '', iconOnly = false }: LogoProps) {
  const content = (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      {iconOnly ? (
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0052CC] to-[#00C896] flex items-center justify-center text-white shadow-xs">
          <span className="font-extrabold text-sm tracking-tight">EH</span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <img
            src="/logo.png"
            alt="Ente Hospital"
            className="h-8 sm:h-9 w-auto object-contain dark:brightness-110 dark:contrast-105 rounded"
          />
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:outline-none rounded-xl inline-block"
        aria-label="Ente Hospital home"
      >
        {content}
      </Link>
    );
  }

  return content;
}
