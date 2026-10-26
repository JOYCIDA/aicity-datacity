import { describe, expect, it } from 'vitest';
import { AppError, notFound } from '../../src/utils/errors.js';

describe('AppError', () => {
  it('porte le statut et le code', () => {
    const e = notFound('x');
    expect(e).toBeInstanceOf(AppError);
    expect(e.statusCode).toBe(404);
    expect(e.code).toBe('INTROUVABLE');
  });
});
