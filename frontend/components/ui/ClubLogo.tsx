// components/ui/ClubLogo.tsx
'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useClubConfig } from '@/hooks/useClubConfig';

const FALLBACK_LOGO = '/images/club/logo.png';

interface ClubLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
  textPosition?: 'right' | 'bottom';
}

const sizes = {
  sm: { container: 'w-8 h-8', image: 32, text: 'text-sm' },
  md: { container: 'w-12 h-12', image: 48, text: 'text-base' },
  lg: { container: 'w-20 h-20', image: 80, text: 'text-2xl' },
  xl: { container: 'w-24 h-24', image: 96, text: 'text-3xl' },
};

export default function ClubLogo({
  size = 'md',
  className = '',
  showText = false,
  textPosition = 'right',
}: ClubLogoProps) {
  const { name, logo, primaryColor, secondaryColor } = useClubConfig();
  const sizeStyle = sizes[size];
  const [src, setSrc] = useState(logo || FALLBACK_LOGO);

  const logoImg = (
    <div
      className={`${sizeStyle.container} rounded-2xl flex items-center justify-center shadow-lg overflow-hidden bg-white`}
    >
      <Image
        src={src}
        alt={name}
        width={sizeStyle.image}
        height={sizeStyle.image}
        className="object-contain p-1"
        priority
        unoptimized
        onError={() => setSrc(FALLBACK_LOGO)}
      />
    </div>
  );

  if (textPosition === 'bottom') {
    return (
      <div className={`flex flex-col items-center ${className}`}>
        {logoImg}
        {showText && (
          <h1
            className={`font-bold ${sizeStyle.text} mt-2 text-center text-[#7c0613]`}
            style={{
              backgroundImage: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`,
              WebkitBackgroundClip: 'text',
              color: 'transparent',
            }}
          >
            {name}
          </h1>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div
        className={`${sizeStyle.container} rounded-lg flex items-center justify-center shadow-md overflow-hidden bg-white`}
      >
        <Image
          src={src}
          alt={name}
          width={sizeStyle.image}
          height={sizeStyle.image}
          className="object-contain p-1"
          priority
          unoptimized
          onError={() => setSrc(FALLBACK_LOGO)}
        />
      </div>
      {showText && (
        <span className={`font-bold ${sizeStyle.text} text-[#7c0613]`}>{name}</span>
      )}
    </div>
  );
}
