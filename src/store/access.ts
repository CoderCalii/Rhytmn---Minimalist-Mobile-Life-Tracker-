import type { UserId } from '../types/auth'

export function canAccessResource(userId: UserId, resourceOwnerId: UserId): boolean {
  return userId === resourceOwnerId
}
