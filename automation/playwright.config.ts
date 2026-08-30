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

export default defineConfig({
  testDir: './tests',

  // ============================================================
  // EXECUTION
  // ============================================================

  // NEXORA currently uses shared backend/database state.
  // Running tests in parallel causes Approval and Goods Receipt
  // scenarios to interfere with one another.
  fullyParallel: false,

  // Stable execution for local and CI regression runs.
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
  // SHARED BROWSER SETTINGS
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
    // AUTH SETUP
    // ----------------------------------------------------------

    {
      name: 'setup',

      testMatch:
        /.*\.setup\.ts/,
    },

    // ----------------------------------------------------------
    // CHROMIUM
    // PRIMARY REGRESSION BROWSER
    // ----------------------------------------------------------

    {
      name: 'chromium',

      dependencies: [
        'setup',
      ],

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
    // CROSS-BROWSER VALIDATION
    // ----------------------------------------------------------

    {
      name: 'firefox',

      dependencies: [
        'setup',
      ],

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
    // CROSS-BROWSER VALIDATION
    // ----------------------------------------------------------

    {
      name: 'webkit',

      dependencies: [
        'setup',
      ],

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