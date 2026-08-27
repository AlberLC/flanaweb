const API_ORIGIN = import.meta.env.VITE_API_ORIGIN ?? window.location.origin
const API_BASE_URL = `${API_ORIGIN}/api`

export const config = {
    API_BASE_URL,
    API_ORIGIN,
    API_UPLOADS_ENDPOINT: `${API_BASE_URL}/files/uploads`,
    MAX_CONCURRENT_CHUNK_UPLOADS: 5
}
