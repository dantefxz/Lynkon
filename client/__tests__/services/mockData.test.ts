describe('mockData (actual implementation)', () => {
  it('getProfileAvatar returns a non-empty string', () => {
    const { getProfileAvatar } = jest.requireActual('@/services/mockData') as typeof import('@/services/mockData');
    const result = getProfileAvatar('user123');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('getProfileAvatar is deterministic for the same seed', () => {
    const { getProfileAvatar } = jest.requireActual('@/services/mockData') as typeof import('@/services/mockData');
    expect(getProfileAvatar('alice')).toBe(getProfileAvatar('alice'));
  });

  it('getProfileAvatar returns different values for different seeds', () => {
    const { getProfileAvatar } = jest.requireActual('@/services/mockData') as typeof import('@/services/mockData');
    const seeds = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const results = new Set(seeds.map(getProfileAvatar));
    expect(results.size).toBeGreaterThan(1);
  });
});
