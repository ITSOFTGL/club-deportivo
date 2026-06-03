'use client';

import { resolveMediaUrl } from '@/lib/utils/mediaUrl';

type StudentAvatarProps = {
  name?: string;
  lastName?: string;
  profilePhotoUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base',
};

export function StudentAvatar({
  name = '',
  lastName = '',
  profilePhotoUrl,
  size = 'md',
  className = '',
}: StudentAvatarProps) {
  const src = resolveMediaUrl(profilePhotoUrl);
  const initials = `${name?.charAt(0) ?? ''}${lastName?.charAt(0) ?? ''}`.toUpperCase() || '?';
  const dim = sizeClasses[size];

  if (src) {
    return (
      <img
        src={src}
        alt={`${name} ${lastName}`.trim()}
        className={`${dim} rounded-lg object-cover flex-shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${dim} rounded-lg flex items-center justify-center flex-shrink-0 bg-gradient-to-r from-[#7c0613] to-[#4a030b] text-white font-bold ${className}`}
    >
      {initials}
    </div>
  );
}
