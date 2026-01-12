import type { UserId } from './auth'

export interface UserProfile {
  id: UserId
  name: string
  email?: string
}

export interface UserPreferences {
  timezone?: string
  locale?: string
}
