import {
  defineConfig,
  devices,
} from '@playwright/test'

import dotenv from 'dotenv'
import path from 'path'

dotenv.config({
  path: path.resolve(
    __dirname,
    '.env',
  ),
})

const baseURL =
  process.env.BASE_URL ??
  'http://localhost:5173'

const apiBaseURL =
  process.env.API_BASE_URL ??
  'http://127.0.0.1:8001'

export default defineConfig({
  testDir: './tests',

  // ============================================================
  // EXECUTION
  // ============================================================

  // NEXORA currently uses shared backend/database state.
  // Parallel execution may cause Procurement tests to interfere
  // with one another.
  fullyParallel: false,

  workers: 1,

  forbidOnly:
    !!process.env.CI,

  retries:
    process.env.CI
      ? 2
      : 0,

  timeout:
    30_000,

  expect: {
    timeout:
      5_000,
  },

  // ============================================================
  // REPORTING
  // ============================================================

  reporter: [
    [
      'html',
      {
        outputFolder:
          'playwright-report',
        open:
          'never',
      },
    ],

    [
      'junit',
      {
        outputFile:
          'test-results/junit-results.xml',
      },
    ],

    [
      'list',
    ],
  ],

  // ============================================================
  // SHARED SETTINGS
  // ============================================================

  use: {
    baseURL,

    trace:
      'retain-on-failure',

    screenshot:
      'only-on-failure',

    video:
      'retain-on-failure',

    actionTimeout:
      10_000,

    navigationTimeout:
      30_000,
  },

  // ============================================================
  // PROJECTS
  // ============================================================

  projects: [
    // ----------------------------------------------------------
    // API TESTING
    // Does not require a browser or UI authentication setup.
    // ----------------------------------------------------------

    {
      name:
        'api',

      testMatch:
        /.*\.api\.spec\.ts/,

      use: {
        baseURL:
          apiBaseURL,
      },
    },

    // ----------------------------------------------------------
    // UI AUTHENTICATION SETUP
    // ----------------------------------------------------------

    {
      name:
        'setup',

      testMatch:
        /.*\.setup\.ts/,
    },

    // ----------------------------------------------------------
    // CHROMIUM
    // ----------------------------------------------------------

    {
      name:
        'chromium',

      dependencies: [
        'setup',
      ],

      testIgnore:
        /.*\.api\.spec\.ts/,

      use: {
        ...devices[
          'Desktop Chrome'
        ],

        storageState:
          'playwright/.auth/admin.json',
      },
    },

    // ----------------------------------------------------------
    // FIREFOX
    // ----------------------------------------------------------

    {
      name:
        'firefox',

      dependencies: [
        'setup',
      ],

      testIgnore:
        /.*\.api\.spec\.ts/,

      use: {
        ...devices[
          'Desktop Firefox'
        ],

        storageState:
          'playwright/.auth/admin.json',
      },
    },

    // ----------------------------------------------------------
    // WEBKIT
    // ----------------------------------------------------------

    {
      name:
        'webkit',

      dependencies: [
        'setup',
      ],

      testIgnore:
        /.*\.api\.spec\.ts/,

      use: {
        ...devices[
          'Desktop Safari'
        ],

        storageState:
          'playwright/.auth/admin.json',
      },
    },
  ],
})