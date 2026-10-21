import {
  expect,
  test,
} from '@playwright/test'

import {
  closeDatabase,
  queryDatabase,
} from '../fixtures/database'

type DatabaseHealthRow = {
  database_name: string
  current_time: Date
}

test.describe(
  'NEXORA Database Connection',
  () => {
    test.afterAll(async () => {
      await closeDatabase()
    })

    test(
      'DB-REQ-001 - automation can connect to the NEXORA database',
      async () => {
        const rows =
          await queryDatabase<DatabaseHealthRow>(
            `
              SELECT
                current_database() AS database_name,
                NOW() AS current_time
            `,
          )

        expect(rows).toHaveLength(1)

        expect(
          rows[0].database_name,
        ).toBeTruthy()

        expect(
          rows[0].current_time,
        ).toBeTruthy()
      },
    )
  },
)