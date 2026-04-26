const { parseRegisterDTO, parseLoginDTO }           = require('../../src/dtos/auth.dto');
const { parseUpdateProfileDTO, parseUpdateSettingsDTO } = require('../../src/dtos/user.dto');
const { parseLinkPlatformDTO }                      = require('../../src/dtos/platform.dto');
const { parseSendMessageDTO }                       = require('../../src/dtos/message.dto');

// ─── Auth DTOs ────────────────────────────────────────────────────────────────

describe('parseRegisterDTO', () => {
  it('falla si falta uid', () => {
    const { errors } = parseRegisterDTO({ email: 'a@a.com', birthDate: '2000-01-01' });
    expect(errors).toContain('uid is required');
  });

  it('falla si birthDate es inválida', () => {
    const { errors } = parseRegisterDTO({ uid: 'u1', email: 'a@a.com', birthDate: 'bad-date' });
    expect(errors.some((e) => e.includes('valid date'))).toBe(true);
  });

  it('pasa con datos válidos', () => {
    const { data, errors } = parseRegisterDTO({ uid: 'u1', email: 'A@A.COM', birthDate: '2000-01-01' });
    expect(errors).toHaveLength(0);
    expect(data.email).toBe('a@a.com'); // normalizado a lowercase
  });
});

describe('parseLoginDTO', () => {
  it('falla si falta idToken', () => {
    const { errors } = parseLoginDTO({});
    expect(errors).toContain('idToken is required');
  });
  it('pasa con idToken', () => {
    const { data } = parseLoginDTO({ idToken: 'tok123' });
    expect(data.idToken).toBe('tok123');
  });
});

// ─── User DTOs ────────────────────────────────────────────────────────────────

describe('parseUpdateProfileDTO', () => {
  it('falla si bio supera 300 chars', () => {
    const { errors } = parseUpdateProfileDTO({ bio: 'a'.repeat(301) });
    expect(errors.some((e) => e.includes('300'))).toBe(true);
  });

  it('falla si no hay campos válidos', () => {
    const { errors } = parseUpdateProfileDTO({ foo: 'bar' });
    expect(errors).toContain('No valid fields provided');
  });

  it('pasa con bio válida', () => {
    const { data } = parseUpdateProfileDTO({ bio: 'Hola mundo' });
    expect(data.bio).toBe('Hola mundo');
  });
});

describe('parseUpdateSettingsDTO', () => {
  it('falla si privacy no es válido', () => {
    const { errors } = parseUpdateSettingsDTO({ privacy: 'invalid' });
    expect(errors.some((e) => e.includes('privacy'))).toBe(true);
  });
  it('pasa con privacy válido', () => {
    const { data } = parseUpdateSettingsDTO({ privacy: 'friends' });
    expect(data.privacy).toBe('friends');
  });
});

// ─── Platform DTOs ────────────────────────────────────────────────────────────

describe('parseLinkPlatformDTO', () => {
  it('falla con plataforma no soportada', () => {
    const { errors } = parseLinkPlatformDTO({ platform: 'nintendo', token: 'abc' });
    expect(errors.some((e) => e.includes('platform must be'))).toBe(true);
  });
  it('pasa con datos válidos', () => {
    const { data } = parseLinkPlatformDTO({ platform: 'steam', token: 'steamToken123' });
    expect(data.platform).toBe('steam');
  });
});

// ─── Message DTOs ─────────────────────────────────────────────────────────────

describe('parseSendMessageDTO', () => {
  it('falla si text está vacío', () => {
    const { errors } = parseSendMessageDTO({ toUserId: 'u2', text: '   ' });
    expect(errors.some((e) => e.includes('empty'))).toBe(true);
  });

  it('falla si text supera 2000 chars', () => {
    const { errors } = parseSendMessageDTO({ toUserId: 'u2', text: 'x'.repeat(2001) });
    expect(errors.some((e) => e.includes('2000'))).toBe(true);
  });

  it('pasa y hace trim del texto', () => {
    const { data } = parseSendMessageDTO({ toUserId: 'u2', text: '  hola  ' });
    expect(data.text).toBe('hola');
  });
});
