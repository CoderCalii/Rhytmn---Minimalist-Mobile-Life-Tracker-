export function validateAmount(amount: number) {
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error('Invalid amount')
  }
}
