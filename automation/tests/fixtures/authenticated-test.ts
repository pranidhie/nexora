import { test as base, expect } from '@playwright/test'
import fs from 'fs'
import path from 'path'

const authDir = path.resolve('playwright/.auth')

const storageStateFile = path.join(
  authDir,
  'admin.json',
)

const sessionStorageFile = path.join(
  authDir,
  'admin-session.json',
)

export const test = base.extend({
  page: async ({ page }, use) => {
    // Load the sessionStorage values created by auth.setup.ts
    if (!fs.existsSync(sessionStorageFile)) {
      throw new Error(
        'admin-session.json was not found. Run auth.setup.ts first.',
      )
    }

    const sessionStorage = JSON.parse(
      fs.readFileSync(
        sessionStorageFile,
        'utf-8',
      ),
    )

    // Restore NEXORA sessionStorage before the application loads
    await page.addInitScript((storage) => {
      if (window.location.hostname === 'localhost') {
        for (const [key, value] of Object.entries(storage)) {
          window.sessionStorage.setItem(
            key,
            String(value),
          )
        }
      }
    }, sessionStorage)

    // Give the authenticated page to the actual test
    await use(page)
  },
})

// Restore normal Playwright browser storage
// such as cookies and localStorage.
test.use({
  storageState: storageStateFile,
})

export { expect }