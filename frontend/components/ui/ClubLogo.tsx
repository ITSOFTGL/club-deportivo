// components/ui/ClubLogo.tsx
'use client';

import Image from 'next/image';
import { useClubConfig } from '@/hooks/useClubConfig';

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
  textPosition = 'right'
}: ClubLogoProps) {
  const { name, logo, primaryColor, secondaryColor } = useClubConfig();
  const sizeStyle = sizes[size];

  if (textPosition === 'bottom') {
    return (
      <div className={`flex flex-col items-center ${className}`}>
        <div className={`${sizeStyle.container} rounded-2xl flex items-center justify-center shadow-lg overflow-hidden bg-white`}>
          <Image
            src={logo}
            alt={name}
            width={sizeStyle.image}
            height={sizeStyle.image}
            className="object-contain p-1"
            priority
            unoptimized
          />
        </div>
        {showText && (
          <h1 className={`font-bold ${sizeStyle.text} mt-2 text-center bg-gradient-to-r from-[${primaryColor}] to-[${secondaryColor}] bg-clip-text text-transparent`}>
            {name}
          </h1>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`${sizeStyle.container} rounded-lg flex items-center justify-center shadow-md overflow-hidden bg-white`}>
        <Image
          src={logo}
          alt={name}
          width={sizeStyle.image}
          height={sizeStyle.image}
          className="object-contain p-1"
          priority
          unoptimized
        />
      </div>
      {showText && (
        <span className={`font-bold ${sizeStyle.text} bg-gradient-to-r from-[${primaryColor}] to-[${secondaryColor}] bg-clip-text text-transparent`}>
          {name}
        </span>
      )}
    </div>
  );
}