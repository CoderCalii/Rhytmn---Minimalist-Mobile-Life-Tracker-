export function validateAmount(amount: number) {
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error('Invalid amount')
  }
}

export function hasSufficientBalance(balance: number, amount: number) {
  if (!Number.isFinite(balance) || !Number.isFinite(amount)) return false
  return balance >= amount
}
