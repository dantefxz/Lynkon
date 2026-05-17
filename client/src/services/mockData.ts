export const profileAvatarImages: string[] = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
  'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&h=100&fit=crop',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
];

export function getProfileAvatar(seed?: string | number | null): string {
  if (!seed) return profileAvatarImages[0];

  const normalizedSeed = String(seed);
  const hash = normalizedSeed
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const index = hash % profileAvatarImages.length;

  return profileAvatarImages[index];
}
