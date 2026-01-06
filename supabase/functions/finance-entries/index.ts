import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0'

type JsonRecord = Record<string, unknown>

type EntryRow = {
  id: string
  amount: number
  category: string | null
  account_id: string | null
  to_account_id: string | null
  type: string | null
  created_at: string | null
  note_ciphertext: string | null
  note_iv: string | null
  note_key_version: number | null
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
}

const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

const base64ToBytes = (value: string) => {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

const bytesToBase64 = (bytes: Uint8Array) => {
  let binary = ''
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

const getActiveKeyVersion = () => {
  const value = Deno.env.get('FINANCE_NOTE_ACTIVE_VERSION') ?? '1'
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error('Invalid FINANCE_NOTE_ACTIVE_VERSION')
  }
  return parsed
}

const getKeyBytes = (version: number) => {
  const keyValue = Deno.env.get(`FINANCE_NOTE_KEY_V${version}`)
  if (!keyValue) {
    throw new Error(`Missing FINANCE_NOTE_KEY_V${version}`)
  }
  const bytes = base64ToBytes(keyValue)
  if (bytes.length !== 32) {
    throw new Error(`FINANCE_NOTE_KEY_V${version} must be 32 bytes base64`)
  }
  return bytes
}

const importKey = async (version: number) => {
  const rawKey = getKeyBytes(version)
  return await crypto.subtle.importKey(
    'raw',
    rawKey,
    'AES-GCM',
    false,
    ['encrypt', 'decrypt']
  )
}

const encryptNote = async (note: string) => {
  const keyVersion = getActiveKeyVersion()
  const key = await importKey(keyVersion)
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const plaintext = textEncoder.encode(note)
  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    plaintext
  )
  return {
    ciphertext: bytesToBase64(new Uint8Array(ciphertextBuffer)),
    iv: bytesToBase64(iv),
    keyVersion
  }
}

const decryptNote = async (ciphertext: string, iv: string, keyVersion: number) => {
  if (!Number.isInteger(keyVersion) || keyVersion <= 0) {
    return null
  }
  const key = await importKey(keyVersion)
  const plaintextBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64ToBytes(iv) },
    key,
    base64ToBytes(ciphertext)
  )
  return textDecoder.decode(plaintextBuffer)
}

const jsonResponse = (status: number, body: JsonRecord) => {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

const normalizeNote = (value: string) => {
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

const parseNumber = (value: unknown) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  return value
}

const parseString = (value: unknown) => {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

const parseUuid = (value: unknown) => {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  const uuidRegex = /^[0-9a-fA-F-]{36}$/
  return uuidRegex.test(trimmed) ? trimmed : null
}

const buildNotePayload = async (noteValue: unknown) => {
  if (noteValue === null) {
    return null
  }

  if (typeof noteValue !== 'string') {
    throw new Error('Invalid note')
  }

  const note = normalizeNote(noteValue)
  if (!note) {
    return null
  }

  const encrypted = await encryptNote(note)
  return {
    note_ciphertext: encrypted.ciphertext,
    note_iv: encrypted.iv,
    note_key_version: encrypted.keyVersion
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return jsonResponse(405, { status: 'error', error: { message: 'Method not allowed' } })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return jsonResponse(401, { status: 'error', error: { message: 'Missing Authorization header' } })
  }
  const token = authHeader.replace(/^Bearer\s+/i, '').trim()
  if (!token) {
    return jsonResponse(401, { status: 'error', error: { message: 'Missing bearer token' } })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
  if (!supabaseUrl || !supabaseAnonKey) {
    return jsonResponse(500, { status: 'error', error: { message: 'Missing Supabase environment' } })
  }

  // The edge runtime verifies the JWT; getUser(token) binds the request to a user id without manual decoding.
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false }
  })

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser(token)

  if (userError || !user) {
    return jsonResponse(401, { status: 'error', error: { message: 'Invalid session' } })
  }

  if (req.method === 'GET') {
    const url = new URL(req.url)
    const limitRaw = url.searchParams.get('limit')
    let limit = 100
    if (limitRaw !== null) {
      const parsed = Number(limitRaw)
      if (!Number.isFinite(parsed) || parsed <= 0) {
        return jsonResponse(400, { status: 'error', error: { message: 'Invalid limit' } })
      }
      limit = Math.min(Math.floor(parsed), 200)
    }

    const accountIdRaw = url.searchParams.get('account_id')
    const accountId = accountIdRaw ? parseUuid(accountIdRaw) : null
    if (accountIdRaw && !accountId) {
      return jsonResponse(400, { status: 'error', error: { message: 'Invalid account_id' } })
    }

    let query = supabase
      .from('finance_entries')
      .select('id, amount, category, account_id, to_account_id, type, created_at, note_ciphertext, note_iv, note_key_version')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (accountId) {
      query = query.eq('account_id', accountId)
    }

    const { data, error } = await query
    if (error) {
      return jsonResponse(500, { status: 'error', error: { message: 'Failed to load entries' } })
    }

    const entries = (data ?? []) as EntryRow[]
    const hydrated = await Promise.all(entries.map(async (entry) => {
      let note: string | null = null
      if (entry.note_ciphertext && entry.note_iv && entry.note_key_version) {
        try {
          note = await decryptNote(entry.note_ciphertext, entry.note_iv, entry.note_key_version)
        } catch {
          note = null
        }
      }

      return {
        id: entry.id,
        amount: entry.amount,
        category: entry.category,
        account_id: entry.account_id,
        to_account_id: entry.to_account_id,
        type: entry.type,
        created_at: entry.created_at,
        note
      }
    }))

    return jsonResponse(200, { status: 'ok', data: { entries: hydrated } })
  }

  let payload: JsonRecord
  try {
    payload = await req.json()
  } catch {
    return jsonResponse(400, { status: 'error', error: { message: 'Invalid JSON' } })
  }

  const amount = parseNumber(payload.amount)
  const category = parseString(payload.category)
  if (amount === null || !category) {
    return jsonResponse(400, { status: 'error', error: { message: 'Invalid amount or category' } })
  }

  const hasAccountId = Object.prototype.hasOwnProperty.call(payload, 'account_id')
  const accountId = hasAccountId
    ? (payload.account_id === null ? null : parseUuid(payload.account_id))
    : undefined
  if (hasAccountId && payload.account_id !== null && !accountId) {
    return jsonResponse(400, { status: 'error', error: { message: 'Invalid account_id' } })
  }

  const typeValue = parseString(payload.type)
  const entryType = typeValue ? typeValue.toLowerCase() : null
  if (entryType && entryType !== 'transfer') {
    return jsonResponse(400, { status: 'error', error: { message: 'Invalid type' } })
  }

  const hasToAccountId = Object.prototype.hasOwnProperty.call(payload, 'to_account_id')
  const toAccountId = hasToAccountId
    ? (payload.to_account_id === null ? null : parseUuid(payload.to_account_id))
    : undefined
  if (hasToAccountId && payload.to_account_id !== null && !toAccountId) {
    return jsonResponse(400, { status: 'error', error: { message: 'Invalid to_account_id' } })
  }

  if (entryType === 'transfer') {
    if (!hasAccountId || !accountId) {
      return jsonResponse(400, { status: 'error', error: { message: 'Missing account_id' } })
    }
    if (!hasToAccountId || !toAccountId) {
      return jsonResponse(400, { status: 'error', error: { message: 'Missing to_account_id' } })
    }
    if (accountId === toAccountId) {
      return jsonResponse(400, { status: 'error', error: { message: 'Accounts must differ' } })
    }
  } else if (hasToAccountId) {
    return jsonResponse(400, { status: 'error', error: { message: 'to_account_id only allowed for transfers' } })
  }

  const hasNote = Object.prototype.hasOwnProperty.call(payload, 'note')
  let notePayload: Record<string, unknown> | null = null
  if (hasNote) {
    try {
      notePayload = await buildNotePayload(payload.note)
    } catch (error) {
      return jsonResponse(400, { status: 'error', error: { message: (error as Error).message } })
    }
  }

  const insertPayload: Record<string, unknown> = {
    user_id: user.id,
    amount,
    category
  }

  if (hasAccountId) {
    insertPayload.account_id = accountId ?? null
  }

  if (entryType) {
    insertPayload.type = entryType
  }

  if (hasToAccountId) {
    insertPayload.to_account_id = toAccountId ?? null
  }

  if (notePayload) {
    Object.assign(insertPayload, notePayload)
  }

  const { data, error } = await supabase
    .from('finance_entries')
    .insert(insertPayload)
    .select('id')
    .single()

  if (error || !data) {
    return jsonResponse(500, { status: 'error', error: { message: 'Failed to save entry' } })
  }

  return jsonResponse(201, { status: 'ok', data: { id: data.id } })
})
