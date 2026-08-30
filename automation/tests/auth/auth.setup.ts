import {
  test as setup,
  expect,
} from '@playwright/test'

import fs from 'fs'
import path from 'path'

const authDir = path.resolve(
  'playwright/.auth',
)

const storageStateFile = path.resolve(
  authDir,
  'admin.json',
)

const sessionStorageFile = path.resolve(
  authDir,
  'admin-session.json',
)

const ADMIN_EMAIL =
  process.env.NEXORA_ADMIN_EMAIL ??
  'admin@nexora.com'

const ADMIN_PASSWORD =
  process.env.NEXORA_ADMIN_PASSWORD

if (!ADMIN_PASSWORD) {
  throw new Error(
    'NEXORA_ADMIN_PASSWORD is not configured.',
  )
}

setup(
  'authenticate NEXORA administrator',
  async ({ page }) => {
    fs.mkdirSync(
      authDir,
      {
        recursive: true,
      },
    )

    await page.goto('/')

    const emailInput =
      page.getByLabel(
        /email/i,
      )

    const passwordInput =
      page.getByLabel(
        /password/i,
      )

    await expect(
      emailInput,
    ).toBeVisible()

    await expect(
      passwordInput,
    ).toBeVisible()

    await emailInput.fill(
      ADMIN_EMAIL,
    )

    await passwordInput.fill(
      ADMIN_PASSWORD,
    )

    const loginButton =
      page.getByRole(
        'button',
        {
          name: /sign in|login/i,
        },
      )

    await loginButton.click()

    await expect(
      page.getByRole(
        'heading',
        {
          name: /procurement command center/i,
        },
      ),
    ).toBeVisible({
      timeout: 20_000,
    })

    const sessionData =
      await page.evaluate(() => {
        const accessToken =
          window.sessionStorage.getItem(
            'nexora_access_token',
          )

        const user =
          window.sessionStorage.getItem(
            'nexora_user',
          )

        return {
          nexora_access_token:
            accessToken,
          nexora_user:
            user,
        }
      })

    if (
      !sessionData
        .nexora_access_token
    ) {
      throw new Error(
        'nexora_access_token was not created after login.',
      )
    }

    if (
      !sessionData
        .nexora_user
    ) {
      throw new Error(
        'nexora_user was not created after login.',
      )
    }

    fs.writeFileSync(
      sessionStorageFile,
      JSON.stringify(
        sessionData,
        null,
        2,
      ),
      'utf-8',
    )

    await page
      .context()
      .storageState({
        path:
          storageStateFile,
      })

    if (
      !fs.existsSync(
        storageStateFile,
      )
    ) {
      throw new Error(
        'admin.json was not created.',
      )
    }

    if (
      !fs.existsSync(
        sessionStorageFile,
      )
    ) {
      throw new Error(
        'admin-session.json was not created.',
      )
    }
  },
)