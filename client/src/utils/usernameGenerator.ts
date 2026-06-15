// Fragmentos para generar nombres de usuario gamer aleatorios
// Estructura: PREFIJO + NUCLEO + SUFIJO (opcional número)

const PREFIXES = [
  'Dark', 'Shadow', 'Storm', 'Cyber', 'Neo', 'Iron', 'Ghost', 'Dragon',
  'Epic', 'Ultra', 'Phoenix', 'Night', 'Alpha', 'Blaze', 'Turbo', 'Hyper',
  'Steel', 'Frost', 'Void', 'Silent', 'Rapid', 'Savage', 'Neon', 'Pixel',
  'Toxic', 'Laser', 'Rogue', 'Omega', 'Astro', 'Inferno',
];

const CORES = [
  'Blade', 'Shield', 'Wolf', 'Fox', 'Eagle', 'Tiger', 'Nova', 'Spark',
  'Rune', 'Fist', 'Claw', 'Byte', 'Hawk', 'Viper', 'Panda', 'Lynx',
  'Cobra', 'Raven', 'Bear', 'Titan', 'Snipe', 'Strike', 'Pulse', 'Blaze',
  'Core', 'Drift', 'Forge', 'Glitch', 'Hunt', 'Jump',
];

const SUFFIXES = [
  'Hunter', 'Slayer', 'Master', 'King', 'Lord', 'Pro', 'Ace', 'Zero',
  'Prime', 'X', 'Max', 'One', 'Force', 'Mode', 'Zone', 'Edge',
  'Ninja', 'Rage', 'Rush', 'Fire',
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateUsername(): string {
  const useNumber = Math.random() < 0.4;
  const useSuffix = Math.random() < 0.5;

  const prefix = pick(PREFIXES);
  const core   = pick(CORES);
  const suffix = useSuffix ? pick(SUFFIXES) : '';
  const number = useNumber ? String(Math.floor(Math.random() * 900) + 100) : '';

  return `${prefix}${core}${suffix}${number}`;
}
