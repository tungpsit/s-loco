// Type declarations for postgres-js
// npm package has no bundled types
declare module 'postgres-js' {
  export interface PostgresOptions {
    url: string
    max?: number
    ssl?: boolean | { rejectUnauthorized?: boolean }
    connect_timeout?: number
    idle_timeout?: number
    prepare?: boolean
    types?: unknown
    debug?: boolean
    onnotice?: (notice: unknown) => void
    onnotification?: (notification: unknown) => void
  }

  export interface QueryResult<T = Record<string, unknown>> {
    rows: T[]
    count?: number
  }

  export interface Transaction {
    <T>(fn: (sql: Sql) => Promise<T>): Promise<T>
  }

  export interface Sql {
    <T = Record<string, unknown>>(
      strings: TemplateStringsArray,
      ...values: unknown[]
    ): Promise<QueryResult<T>>
    uuid(): string
    datetime(): Date
    json(value: unknown): unknown
    true: 1
    false: 0
    undefined: null
  }

  export interface Postgres {
    (strings: TemplateStringsArray, ...values: unknown[]): Promise<QueryResult>
    begin<T>(fn: (sql: Sql) => Promise<T>): Promise<T>
    end(): Promise<void>
    subscribe(channel: string, callback: (msg: unknown) => void): void
  }

  export default function postgres(url: string, options?: PostgresOptions): Postgres
}
