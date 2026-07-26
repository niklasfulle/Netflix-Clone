const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(uuid)/)',
  ],
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'hooks/**/*.{js,jsx,ts,tsx}',
    'actions/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'data/**/*.{js,jsx,ts,tsx}',
    'schemas/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
    '!**/__tests__/**',
    '!app/api/**/__tests__/**',
    // Next.js framework shells and pass-through adapters contain no business logic.
    '!app/**/layout.tsx',
    '!app/auth/**/page.tsx',
    '!app/api/auth/**',
    '!lib/db.ts',
    '!lib/i18n/translations.ts',
    '!lib/auth.ts',
    '!lib/logger.ts',
    '!lib/mail.ts',
  ],
  collectCoverage: true,
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/coverage/',
    '/app/.*/layout\\.tsx$',
    '/app/auth/.*/page\\.tsx$',
    '/app/api/auth/',
    '/lib/db\\.ts$',
    '/lib/i18n/translations\\.ts$',
    '/lib/auth\\.ts$',
    '/lib/logger\\.ts$',
    '/lib/mail\\.ts$',
  ],
  coverageReporters: ['text', 'lcov', 'json-summary'],
  coverageDirectory: 'coverage',
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
