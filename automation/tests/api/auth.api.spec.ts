import {
  test,
  expect,
} from '@playwright/test'

const adminEmail =
  process.env.NEXORA_ADMIN_EMAIL

const adminPassword =
  process.env.NEXORA_ADMIN_PASSWORD

test.describe(
  'NEXORA Authentication API',
  () => {
    test(
      'SEC-REQ-001 - valid administrator credentials return an access token',
      async ({ request }) => {
        expect(
          adminEmail,
          'NEXORA_ADMIN_EMAIL must be configured',
        ).toBeTruthy()

        expect(
          adminPassword,
          'NEXORA_ADMIN_PASSWORD must be configured',
        ).toBeTruthy()

        const response =
          await request.post(
            '/api/v1/auth/login',
            {
              data: {
                email:
                  adminEmail,
                password:
                  adminPassword,
              },
            },
          )

        expect(
          response.status(),
        ).toBe(200)

        const responseBody =
          await response.json()

        expect(
          responseBody.access_token,
        ).toBeTruthy()

        expect(
          responseBody.token_type,
        ).toBe('bearer')

        expect(
          responseBody.user.email,
        ).toBe(adminEmail)

        expect(
          responseBody.user.user_id,
        ).toBeTruthy()
      },
    )

    test(
      'SEC-REQ-001 - invalid password is rejected',
      async ({ request }) => {
        expect(
          adminEmail,
          'NEXORA_ADMIN_EMAIL must be configured',
        ).toBeTruthy()

        const response =
          await request.post(
            '/api/v1/auth/login',
            {
              data: {
                email:
                  adminEmail,
                password:
                  'IncorrectDemoPassword!',
              },
            },
          )

        expect(
          response.status(),
        ).toBe(401)

        const responseBody =
          await response.json()

        expect(
          responseBody.detail,
        ).toBe(
          'Invalid email or password',
        )
      },
    )
  },
)