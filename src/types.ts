export type ApiRequestInit = Omit<RequestInit, 'body'> & { body?: BodyInit | JsonValue | null }
export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }
export type QueryParams = Record<string, string | number | boolean | null | undefined>
export type ValueOf<T> = T[keyof T]
