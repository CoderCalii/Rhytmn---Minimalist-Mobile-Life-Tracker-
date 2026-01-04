export type UserId = string & { readonly brand: unique symbol }

export interface AuthContext {
  userId: UserId
  isAuthenticated: boolean
}
