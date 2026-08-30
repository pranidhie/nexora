import { test as base, expect } from '@playwright/test'
import fs from 'fs'
import path from 'path'

const sessionStorageFile = path.resolve(
  'playwright/.auth/admin-session.json',
)

type SessionData = {
  nexora_access_token: string
  nexora_user: string
}

export const test = base.extend({
  page: async ({ page }, use) => {
    if (!fs.existsSync(sessionStorageFile)) {
      throw new Error(
        'admin-session.json not found. Run auth.setup.ts first.',
      )
    }

    const sessionData: SessionData = JSON.parse(
      fs.readFileSync(
        sessionStorageFile,
        'utf-8',
      ),
    )

    await page.addInitScript((data: SessionData) => {
      window.sessionStorage.setItem(
        'nexora_access_token',
        data.nexora_access_token,
      )

      window.sessionStorage.setItem(
        'nexora_user',
        data.nexora_user,
      )
    }, sessionData)

    await use(page)
  },
})

export { expect }