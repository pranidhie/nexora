import type {
  APIRequestContext,
  APIResponse,
} from '@playwright/test'

export class NexoraApiClient {
  private accessToken:
    string | undefined

  constructor(
    private readonly request:
      APIRequestContext,
  ) {}

  async authenticate():
    Promise<void> {
    const email =
      process.env
        .NEXORA_ADMIN_EMAIL

    const password =
      process.env
        .NEXORA_ADMIN_PASSWORD

    if (!email) {
      throw new Error(
        'NEXORA_ADMIN_EMAIL is not configured.',
      )
    }

    if (!password) {
      throw new Error(
        'NEXORA_ADMIN_PASSWORD is not configured.',
      )
    }

    const response =
      await this.request.post(
        '/api/v1/auth/login',
        {
          data: {
            email,
            password,
          },
        },
      )

    if (!response.ok()) {
      throw new Error(
        `API authentication failed with HTTP ${response.status()}`,
      )
    }

    const responseBody =
      await response.json()

    if (
      !responseBody
        .access_token
    ) {
      throw new Error(
        'Access token was not returned.',
      )
    }

    this.accessToken =
      responseBody.access_token
  }

  private authorizationHeaders():
    Record<string, string> {
    if (!this.accessToken) {
      throw new Error(
        'Authenticate the API client before sending a protected request.',
      )
    }

    return {
      Authorization:
        `Bearer ${this.accessToken}`,
    }
  }

  async get(
    path: string,
  ): Promise<APIResponse> {
    return await this.request.get(
      path,
      {
        headers:
          this.authorizationHeaders(),
      },
    )
  }

  async post(
    path: string,
    data: unknown,
  ): Promise<APIResponse> {
    return await this.request.post(
      path,
      {
        headers:
          this.authorizationHeaders(),
        data,
      },
    )
  }

  async patch(
    path: string,
    data: unknown,
  ): Promise<APIResponse> {
    return await this.request.patch(
      path,
      {
        headers:
          this.authorizationHeaders(),
        data,
      },
    )
  }
}