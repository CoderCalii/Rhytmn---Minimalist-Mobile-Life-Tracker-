import { supabase } from './supabase'

export type FinanceEntryRow = {
  id: string
  amount: number | string
  category: string | null
  note: string | null
  account_id: string | null
  to_account_id?: string | null
  type?: string | null
  created_at: string | null
}

type ListOptions = {
  limit?: number
  accountId?: string | null
}

type CreateEntryInput = {
  amount: number
  category: string
  note?: string | null
  account_id?: string | null
  to_account_id?: string | null
  type?: 'transfer' | 'income' | 'expense' | 'goal'
}

const getSessionOrError = async () => {
  const { data, error } = await supabase.auth.getSession()
  if (error || !data.session) {
    return { session: null, error: 'Session expired. Please sign in again.' }
  }
  return { session: data.session, error: null }
}

const buildQuery = ({ limit = 100, accountId = null }: ListOptions) => {
  const params = new URLSearchParams()
  params.set('limit', String(limit))
  if (accountId) params.set('account_id', accountId)
  const query = params.toString()
  return query ? `?${query}` : ''
}

export const listFinanceEntries = async (options: ListOptions = {}) => {
  const { error: sessionError } = await getSessionOrError()
  if (sessionError) {
    return { entries: [] as FinanceEntryRow[], error: sessionError }
  }

  const { data, error } = await supabase.functions.invoke(
    `finance-entries${buildQuery(options)}`,
    { method: 'GET' }
  )

  if (error || data?.status !== 'ok') {
    console.warn('[finance-entries] list failed', {
      status: (error as { context?: Response })?.context?.status,
      requestId:
        (error as { context?: Response })?.context?.headers?.get('sb-request-id') ??
        (error as { context?: Response })?.context?.headers?.get('x-sb-request-id') ??
        null,
      message: error?.message,
      dataStatus: data?.status
    })
    return { entries: [] as FinanceEntryRow[], error: 'Failed to load entries.' }
  }

  return {
    entries: (data?.data?.entries ?? []) as FinanceEntryRow[],
    error: null
  }
}

export const createFinanceEntry = async (input: CreateEntryInput) => {
  const { error: sessionError } = await getSessionOrError()
  if (sessionError) {
    return { id: null as string | null, error: sessionError }
  }

  const { data, error } = await supabase.functions.invoke('finance-entries', {
    method: 'POST',
    body: input
  })

  if (error || data?.status !== 'ok') {
    console.warn('[finance-entries] create failed', {
      status: (error as { context?: Response })?.context?.status,
      requestId:
        (error as { context?: Response })?.context?.headers?.get('sb-request-id') ??
        (error as { context?: Response })?.context?.headers?.get('x-sb-request-id') ??
        null,
      message: error?.message,
      dataStatus: data?.status
    })
    return { id: null as string | null, error: 'Failed to save entry.' }
  }

  return {
    id: (data?.data?.id ?? null) as string | null,
    error: null
  }
}
