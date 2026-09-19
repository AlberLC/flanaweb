import { config } from '@/config'
import type { CreateUploadResponse, FileResponse, UploadState } from '@/interfaces'
import { apiFetch, apiFetchJson } from '@/services/httpClient'
import { hashBlob } from '@/utils/crypto'

export async function completeUpload(uploadId: string, signal: AbortSignal): Promise<FileResponse> {
    return apiFetchJson<FileResponse>(`${config.API_UPLOADS_ENDPOINT}/${uploadId}/complete`, { method: 'POST', signal })
}

export async function createUpload(
    file: File,
    expiresIn: number | null,
    signal: AbortSignal
): Promise<CreateUploadResponse> {
    return apiFetchJson<CreateUploadResponse>(`${config.API_UPLOADS_ENDPOINT}`, {
        method: 'POST',
        body: {
            file_name: file.name,
            file_size: file.size,
            ...(expiresIn !== null && { file_expires_in: expiresIn })
        },
        signal
    })
}

export async function getUploadState(uploadId: string, signal: AbortSignal): Promise<UploadState | undefined> {
    try {
        const uploadState = await apiFetchJson<{
            chunkSize: number
            uploadedChunks: number[]
        }>(`${config.API_UPLOADS_ENDPOINT}/${uploadId}`, { method: 'GET', signal })

        return { ...uploadState, uploadedChunks: new Set(uploadState.uploadedChunks) }
    } catch {}
}

export async function uploadChunk(
    file: File,
    uploadId: string,
    chunkSize: number,
    chunkIndex: number,
    signal: AbortSignal
): Promise<void> {
    const start = chunkIndex * chunkSize
    const end = Math.min(start + chunkSize, file.size)
    const blob = file.slice(start, end)
    const checksum = await hashBlob(blob)

    await apiFetch(`${config.API_UPLOADS_ENDPOINT}/${uploadId}/chunks`, {
        method: 'PATCH',
        headers: {
            'Chunk-Index': chunkIndex.toString(),
            'Chunk-Checksum': checksum,
            'Content-Type': 'application/octet-stream'
        },
        body: blob,
        signal
    })
}

export async function uploadFile(
    file: File,
    uploadId: string,
    chunkSize: number,
    uploadedChunks: Set<number>,
    signal: AbortSignal,
    onProgress: (progress: number) => void
): Promise<FileResponse> {
    const totalChunks = Math.ceil(file.size / chunkSize)
    let chunkIndex = 0
    let completedChunks = uploadedChunks.size

    await Promise.all(
        Array.from({ length: Math.min(config.MAX_CONCURRENT_CHUNK_UPLOADS, totalChunks) }, async () => {
            while (true) {
                signal.throwIfAborted()

                let currentChunk: number

                do {
                    currentChunk = chunkIndex++

                    if (currentChunk >= totalChunks) {
                        return
                    }
                } while (uploadedChunks.has(currentChunk))

                await uploadChunk(file, uploadId, chunkSize, currentChunk, signal)
                completedChunks++
                onProgress((completedChunks / totalChunks) * 100)
            }
        })
    )

    return completeUpload(uploadId, signal)
}
