export async function apiFetch(url: string, init: RequestInit = {}): Promise<Response> {
    const headers = new Headers()

    if (init.body && !(init.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json')
    }

    headers.set('Authorization', `Bearer ${import.meta.env.VITE_FLANASERVER_API_ACCESS_TOKEN}`)
    new Headers(init.headers).forEach((value, key) => {
        headers.set(key, value)
    })

    const response = await fetch(url, {
        ...init,
        headers: headers
    })

    if (!response.ok) {
        throw new Error(`API error ${response.status}: ${response.url}`)
    }

    return response
}
