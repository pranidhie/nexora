import {
  test,
  expect,
  type Page,
} from '@playwright/test'

const APP_URL =
  'http://localhost:5173/'

const VALID_EMAIL =
  process.env.NEXORA_ADMIN_EMAIL ??
  'admin@nexora.com'

const VALID_PASSWORD =
  process.env.NEXORA_ADMIN_PASSWORD

if (!VALID_PASSWORD) {
  throw new Error(
    'NEXORA_ADMIN_PASSWORD is not configured.',
  )
}

// ============================================================
// IMPORTANT
//
// Authentication tests deliberately run serially.
//
// Password authentication can be CPU-expensive and we do not
// want multiple login attempts competing against the local
// FastAPI development server at the same time.
// ============================================================

test.describe.configure({
  mode: 'serial',
})

// ============================================================
// HELPERS
// ============================================================

async function openLoginPage(
  page: Page,
) {
  await page.goto(APP_URL)

  await expect(
    page.getByRole(
      'heading',
      {
        name: 'Welcome back',
        exact: true,
      },
    ),
  ).toBeVisible()
}

async function login(
  page: Page,
  email: string,
  password: string,
) {
  await page
    .locator('#email')
    .fill(email)

  await page
    .locator('#password')
    .fill(password)

  await page
    .locator(
      'button[type="submit"]',
    )
    .click()
}

async function expectDashboard(
  page: Page,
) {
  await expect(
    page.getByRole(
      'heading',
      {
        name:
          'Procurement Command Center',
        exact: true,
      },
    ),
  ).toBeVisible({
    timeout: 20_000,
  })

  await expect(
    page.getByRole(
      'button',
      {
        name: 'Dashboard',
        exact: true,
      },
    ),
  ).toBeVisible()
}

async function expectInvalidCredentials(
  page: Page,
) {
  const errorMessage =
    page.getByRole('alert')

  await expect(
    errorMessage,
  ).toHaveText(
    'Invalid email or password.',
    {
      timeout: 20_000,
    },
  )

  await expect(
    page.getByRole(
      'heading',
      {
        name: 'Welcome back',
        exact: true,
      },
    ),
  ).toBeVisible()
}

// ============================================================
// LOGIN-001
// VALID LOGIN
// ============================================================

test(
  'LOGIN-001 - Login with valid credentials',
  async ({ page }) => {
    await openLoginPage(page)

    await login(
      page,
      VALID_EMAIL,
      VALID_PASSWORD,
    )

    await expectDashboard(page)
  },
)

// ============================================================
// LOGIN-002
// INVALID PASSWORD
// ============================================================

test(
  'LOGIN-002 - Login with invalid password',
  async ({ page }) => {
    await openLoginPage(page)

    await login(
      page,
      VALID_EMAIL,
      'WrongPassword123',
    )

    await expectInvalidCredentials(
      page,
    )
  },
)

// ============================================================
// LOGIN-003
// INVALID EMAIL
// ============================================================

test(
  'LOGIN-003 - Login with invalid email',
  async ({ page }) => {
    await openLoginPage(page)

    await login(
      page,
      'invalid@nexora.com',
      VALID_PASSWORD,
    )

    await expectInvalidCredentials(
      page,
    )
  },
)

// ============================================================
// LOGIN-004
// INVALID EMAIL + INVALID PASSWORD
// ============================================================

test(
  'LOGIN-004 - Login with invalid email and invalid password',
  async ({ page }) => {
    await openLoginPage(page)

    await login(
      page,
      'invalid@nexora.com',
      'WrongPassword123',
    )

    await expectInvalidCredentials(
      page,
    )
  },
)

// ============================================================
// LOGIN-005
// EMPTY EMAIL
// ============================================================

test(
  'LOGIN-005 - Login with empty email',
  async ({ page }) => {
    await openLoginPage(page)

    await page
      .locator('#password')
      .fill(VALID_PASSWORD)

    await page
      .locator(
        'button[type="submit"]',
      )
      .click()

    await expect(
      page.getByRole('alert'),
    ).toHaveText(
      'Email and password are required.',
    )

    await expect(
      page.getByRole(
        'heading',
        {
          name: 'Welcome back',
          exact: true,
        },
      ),
    ).toBeVisible()
  },
)

// ============================================================
// LOGIN-006
// EMPTY PASSWORD
// ============================================================

test(
  'LOGIN-006 - Login with empty password',
  async ({ page }) => {
    await openLoginPage(page)

    await page
      .locator('#email')
      .fill(VALID_EMAIL)

    await page
      .locator(
        'button[type="submit"]',
      )
      .click()

    await expect(
      page.getByRole('alert'),
    ).toHaveText(
      'Email and password are required.',
    )

    await expect(
      page.getByRole(
        'heading',
        {
          name: 'Welcome back',
          exact: true,
        },
      ),
    ).toBeVisible()
  },
)

// ============================================================
// LOGIN-007
// BOTH FIELDS EMPTY
// ============================================================

test(
  'LOGIN-007 - Login with both fields empty',
  async ({ page }) => {
    await openLoginPage(page)

    await page
      .locator(
        'button[type="submit"]',
      )
      .click()

    await expect(
      page.getByRole('alert'),
    ).toHaveText(
      'Email and password are required.',
    )

    await expect(
      page.getByRole(
        'heading',
        {
          name: 'Welcome back',
          exact: true,
        },
      ),
    ).toBeVisible()
  },
)

// ============================================================
// LOGIN-008
// PASSWORD MASKED
// ============================================================

test(
  'LOGIN-008 - Password should be masked',
  async ({ page }) => {
    await openLoginPage(page)

    const passwordInput =
      page.locator('#password')

    await expect(
      passwordInput,
    ).toHaveAttribute(
      'type',
      'password',
    )
  },
)

// ============================================================
// LOGIN-009
// SHOW / HIDE PASSWORD
// ============================================================

test(
  'LOGIN-009 - Show and hide password',
  async ({ page }) => {
    await openLoginPage(page)

    const passwordInput =
      page.locator('#password')

    await expect(
      passwordInput,
    ).toHaveAttribute(
      'type',
      'password',
    )

    await page
      .getByRole(
        'button',
        {
          name: 'Show',
          exact: true,
        },
      )
      .click()

    await expect(
      passwordInput,
    ).toHaveAttribute(
      'type',
      'text',
    )

    await page
      .getByRole(
        'button',
        {
          name: 'Hide',
          exact: true,
        },
      )
      .click()

    await expect(
      passwordInput,
    ).toHaveAttribute(
      'type',
      'password',
    )
  },
)

// ============================================================
// LOGIN-010
// LOGOUT AFTER SUCCESSFUL LOGIN
// ============================================================

test(
  'LOGIN-010 - Logout after successful login',
  async ({ page }) => {
    await openLoginPage(page)

    await login(
      page,
      VALID_EMAIL,
      VALID_PASSWORD,
    )

    await expectDashboard(page)

    await page
      .getByRole(
        'button',
        {
          name: 'Sign out',
          exact: true,
        },
      )
      .click()

    await expect(
      page.getByRole(
        'heading',
        {
          name: 'Welcome back',
          exact: true,
        },
      ),
    ).toBeVisible({
      timeout: 10_000,
    })

    await expect(
      page.locator('#email'),
    ).toBeVisible()

    await expect(
      page.locator('#password'),
    ).toBeVisible()

    await expect(
      page.getByRole(
        'heading',
        {
          name:
            'Procurement Command Center',
          exact: true,
        },
      ),
    ).not.toBeVisible()
  },
)