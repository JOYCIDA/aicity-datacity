import { describe, expect, it } from 'vitest';
import jwt from 'jsonwebtoken';
import { signerToken, verifierToken } from '../../src/utils/jwt.js';

const SECRET = 'secret-de-test-uniquement-0123456789abcdef0123456789';

describe('jwt', () => {
  it('signe puis vérifie un jeton', () => {
    const token = signerToken({ id: 'u1', role: 'ADMIN' });
    expect(verifierToken(token)).toEqual({ sub: 'u1', role: 'ADMIN' });
  });

  it('refuse un jeton signé avec un autre secret', () => {
    const token = jwt.sign({ role: 'ADMIN' }, 'autre-secret-autre-secret-autre-secret-12', {
      subject: 'u1',
    });
    expect(verifierToken(token)).toBeNull();
  });

  it('refuse un jeton expiré', () => {
    const token = jwt.sign({ role: 'ADMIN' }, SECRET, { subject: 'u1', expiresIn: -10 });
    expect(verifierToken(token)).toBeNull();
  });

  it('refuse un rôle inconnu et un texte quelconque', () => {
    const token = jwt.sign({ role: 'ROOT' }, SECRET, { subject: 'u1' });
    expect(verifierToken(token)).toBeNull();
    expect(verifierToken('n-importe-quoi')).toBeNull();
  });

  it('refuse un jeton non signé (alg none)', () => {
    const none = jwt.sign({ role: 'ADMIN' }, '', { algorithm: 'none', subject: 'u1' });
    expect(verifierToken(none)).toBeNull();
  });
});
