import {
  Client,
  type QueryResultRow,
} from 'pg'

function getDatabaseUrl(): string {
  const databaseUrl =
    process.env.DATABASE_URL

  if (!databaseUrl) {
    throw new Error(
      'DATABASE_URL must be configured in automation/.env',
    )
  }

  return databaseUrl
    .replace(
      /^postgresql\+psycopg:\/\//,
      'postgresql://',
    )
    .replace(
      /^postgresql\+psycopg2:\/\//,
      'postgresql://',
    )
    .replace(
      /^postgresql\+asyncpg:\/\//,
      'postgresql://',
    )
}

export async function queryDatabase<
  RowType extends QueryResultRow,
>(
  sql: string,
  parameters: unknown[] = [],
): Promise<RowType[]> {
  const databaseClient = new Client({
    connectionString: getDatabaseUrl(),
  })

  await databaseClient.connect()

  try {
    const result =
      await databaseClient.query<RowType>(
        sql,
        parameters,
      )

    return result.rows
  } finally {
    await databaseClient.end()
  }
}

/*
 * Retained so existing test files do not need changes.
 * Each query now manages and closes its own connection.
 */
export async function closeDatabase(): Promise<void> {
  return Promise.resolve()
}