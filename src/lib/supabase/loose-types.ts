/**
 * Loose Supabase client types for tables not yet in generated Database types.
 * Use this for new tables (RBAC, etc.) until `supabase gen types` is re-run.
 */

export type LooseClient = {
  from: (table: string) => {
    select: (cols: string, opts?: Record<string, unknown>) => LooseQuery
    insert: (data: unknown) => LooseInsertQuery
    update: (data: unknown) => LooseFilter
    delete: () => LooseFilter
  }
}

export type LooseQuery = Promise<{
  data: unknown[] | null
  error: { message: string } | null
  count?: number
}> & {
  eq: (col: string, val: unknown) => LooseQuery
  is: (col: string, val: unknown) => LooseQuery
  neq: (col: string, val: unknown) => LooseQuery
  in: (col: string, val: unknown[]) => LooseQuery
  order: (col: string, opts?: Record<string, unknown>) => LooseQuery
  single: () => LooseSingleQuery
  maybeSingle: () => LooseSingleQuery
  limit: (n: number) => LooseQuery
}

export type LooseInsertQuery = Promise<{
  data: unknown
  error: { message: string } | null
}> & {
  select: (cols: string) => LooseSelectAfterInsert
}

export type LooseSelectAfterInsert = Promise<{
  data: unknown
  error: { message: string } | null
}> & {
  single: () => LooseSingleQuery
}

export type LooseSingleQuery = Promise<{
  data: unknown
  error: { message: string } | null
}>

export type LooseFilter = Promise<{ error: { message: string } | null }> & {
  eq: (col: string, val: unknown) => LooseFilter
  is: (col: string, val: unknown) => LooseFilter
}
