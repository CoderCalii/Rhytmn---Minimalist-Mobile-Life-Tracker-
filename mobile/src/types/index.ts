export type ID = string

export interface Todo {
  id: ID
  text: string
  done: boolean
}

export type { AuthContext, UserId } from './auth'
export type { ApiError, ApiResponse, ApiStatus } from './api'
export type { UserPreferences, UserProfile } from './user'
