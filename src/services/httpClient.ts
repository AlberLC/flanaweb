import type { ApiRequestInit, QueryParams } from '@/types'

function camelToSnake(key: string): string {
    return key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
}

function snakeToCamel(key: string): string {
    return key.replace(/([-_][a-z])/gi, (group) => group.toUpperCase().replace(/[-_]/, ''))
}

function transformKeys(value: unknown, transform: (key: string) => string): unknown {
    if (Array.isArray(value)) {
        return value.map((item) => transformKeys(item, transform))
    }

    if (value && typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value).map(([key, value]) => [transform(key), transformKeys(value, transform)])
        )
    }

    return value
}

export async function apiFetch(url: string, init: ApiRequestInit = {}, params: QueryParams = {}): Promise<Response> {
    const urlSearchParams = new URLSearchParams()

    Object.entries(params).forEach(([key, value]) => {
        urlSearchParams.set(camelToSnake(key), String(value))
    })

    const queryString = urlSearchParams.toString()
    const requestUrl = queryString ? `${url}?${queryString}` : url

    let body: BodyInit | null | undefined
    const headers = new Headers()

    if (
        init.body === undefined ||
        init.body instanceof Blob ||
        init.body instanceof FormData ||
        init.body instanceof URLSearchParams ||
        init.body instanceof ReadableStream ||
        init.body instanceof ArrayBuffer ||
        ArrayBuffer.isView(init.body)
    ) {
        body = init.body
    } else {
        headers.set('Content-Type', 'application/json')
        body = JSON.stringify(transformKeys(init.body, camelToSnake))
    }

    headers.set('Authorization', `Bearer ${import.meta.env.VITE_FLANASERVER_API_ACCESS_TOKEN}`)
    new Headers(init.headers).forEach((value, key) => {
        headers.set(key, value)
    })

    const response = await fetch(requestUrl, { ...init, body, headers })

    if (!response.ok) {
        throw new Error(`API error ${response.status}: ${response.url}`)
    }

    return response
}

export async function apiFetchJson<T>(url: string, init: ApiRequestInit = {}, params: QueryParams = {}): Promise<T> {
    const response = await apiFetch(url, init, params)
    return transformKeys(await response.json(), snakeToCamel) as T
}
