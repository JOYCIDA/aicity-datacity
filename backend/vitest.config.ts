import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    // Les tests d'intégration partagent la base aicity_test : un fichier à la fois.
    fileParallelism: false,
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://aicity:aicity@localhost:5432/aicity',
      JWT_SECRET: 'secret-de-test-uniquement-0123456789abcdef0123456789',
    },
  },
});
