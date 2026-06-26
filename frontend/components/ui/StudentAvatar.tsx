'use client';

import { useState } from 'react';
import { resolveMediaUrl } from '@/lib/utils/mediaUrl';

type StudentAvatarProps = {
  name?: string;
  lastName?: string;
  profilePhotoUrl?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
};

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base',
  xl: 'w-20 h-20 text-lg',
};

export function StudentAvatar({
  name = '',
  lastName = '',
  profilePhotoUrl,
  size = 'md',
  className = '',
}: StudentAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const src = resolveMediaUrl(profilePhotoUrl);
  const initials =
    `${name?.charAt(0) ?? ''}${lastName?.charAt(0) ?? ''}`.toUpperCase() || '?';
  const dim = sizeClasses[size];

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={`${name} ${lastName}`.trim()}
        className={`${dim} rounded-lg object-cover flex-shrink-0 bg-gray-100 ${className}`}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div
      className={`${dim} rounded-lg flex items-center justify-center flex-shrink-0 bg-gradient-to-r from-[#7c0613] to-[#4a030b] text-white font-bold ${className}`}
      aria-hidden={Boolean(src)}
    >
      {initials}
    </div>
  );
}
