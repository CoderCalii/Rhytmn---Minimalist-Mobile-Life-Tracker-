export type ApiStatus = 'ok' | 'error'

export interface ApiError {
  message: string
  code?: string
}

export interface ApiResponse<T> {
  status: ApiStatus
  data?: T
  error?: ApiError
}
