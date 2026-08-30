const API_BASE_URL = 'http://127.0.0.1:8001'

export const apiClient = async (
  path: string,
  options: RequestInit = {},
) => {
  const token = sessionStorage.getItem('nexora_access_token')

  const headers = new Headers(options.headers)

  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(
    `${API_BASE_URL}${path}`,
    {
      ...options,
      headers,
    },
  )

  return response
}

export { API_BASE_URL }