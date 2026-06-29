import { generateUsername } from '@/utils/usernameGenerator';

const PREFIXES = [
  'Dark','Shadow','Storm','Cyber','Neo','Iron','Ghost','Dragon',
  'Epic','Ultra','Phoenix','Night','Alpha','Blaze','Turbo','Hyper',
  'Steel','Frost','Void','Silent','Rapid','Savage','Neon','Pixel',
  'Toxic','Laser','Rogue','Omega','Astro','Inferno',
];

const CORES = [
  'Blade','Shield','Wolf','Fox','Eagle','Tiger','Nova','Spark',
  'Rune','Fist','Claw','Byte','Hawk','Viper','Panda','Lynx',
  'Cobra','Raven','Bear','Titan','Snipe','Strike','Pulse','Blaze',
  'Core','Drift','Forge','Glitch','Hunt','Jump',
];

const SUFFIXES = [
  'Hunter','Slayer','Master','King','Lord','Pro','Ace','Zero',
  'Prime','X','Max','One','Force','Mode','Zone','Edge',
  'Ninja','Rage','Rush','Fire',
];

describe('generateUsername', () => {
  it('returns a non-empty string', () => {
    const name = generateUsername();
    expect(typeof name).toBe('string');
    expect(name.length).toBeGreaterThan(0);
  });

  it('always starts with a known prefix', () => {
    for (let i = 0; i < 30; i++) {
      const name = generateUsername();
      const startsWithPrefix = PREFIXES.some((p) => name.startsWith(p));
      expect(startsWithPrefix).toBe(true);
    }
  });

  it('always contains a known core', () => {
    for (let i = 0; i < 50; i++) {
      const name = generateUsername();
      // Strip any trailing 3-digit number, then find the longest matching prefix,
      // and verify the rest starts with a known core
      const nameNoNum = name.replace(/\d{3}$/, '');
      const containsCore = CORES.some((c) => nameNoNum.includes(c));
      expect(containsCore).toBe(true);
    }
  });

  it('optionally ends with a 3-digit number', () => {
    const results = Array.from({ length: 100 }, () => generateUsername());
    const withNumber = results.filter((n) => /\d{3}$/.test(n));
    const withoutNumber = results.filter((n) => !/\d+$/.test(n));
    // Both variants should appear in 100 runs (40% chance of number)
    expect(withNumber.length).toBeGreaterThan(0);
    expect(withoutNumber.length).toBeGreaterThan(0);
  });

  it('trailing number is always 3 digits (100–999)', () => {
    const results = Array.from({ length: 200 }, () => generateUsername());
    results.forEach((name) => {
      const match = name.match(/(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        expect(num).toBeGreaterThanOrEqual(100);
        expect(num).toBeLessThanOrEqual(999);
      }
    });
  });

  it('suffix is optional — not every username has one', () => {
    const results = Array.from({ length: 100 }, () => generateUsername());
    const withSuffix = results.filter((name) =>
      SUFFIXES.some((s) => name.replace(/\d+$/, '').endsWith(s)),
    );
    const withoutSuffix = results.filter(
      (name) => !SUFFIXES.some((s) => name.replace(/\d+$/, '').endsWith(s)),
    );
    expect(withSuffix.length).toBeGreaterThan(0);
    expect(withoutSuffix.length).toBeGreaterThan(0);
  });

  it('produces different names across multiple calls', () => {
    const names = new Set(Array.from({ length: 20 }, () => generateUsername()));
    expect(names.size).toBeGreaterThan(1);
  });

  it('deterministically picks first elements when Math.random returns known values', () => {
    // useNumber  (call 1): 0.9 → 0.9 < 0.4 = false  → no number
    // useSuffix  (call 2): 0.9 → 0.9 < 0.5 = false  → no suffix
    // pick prefix (call 3): 0.0 → PREFIXES[0] = 'Dark'
    // pick core   (call 4): 0.0 → CORES[0]    = 'Blade'
    const spy = jest.spyOn(Math, 'random')
      .mockReturnValueOnce(0.9)
      .mockReturnValueOnce(0.9)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0);
    const name = generateUsername();
    expect(name).toBe('DarkBlade');
    spy.mockRestore();
  });
});
