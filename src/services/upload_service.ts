import { config } from '@/config'
import type { CreateUploadResponse, UploadState, VirtualFile } from '@/types/interfaces'
import { hashBlob } from '@/utils/crypto'

export async function completeUpload(uploadId: string, signal: AbortSignal): Promise<VirtualFile> {
    const response = await fetch(
        `${import.meta.env.VITE_API_ORIGIN}${config.API_UPLOADS_ENDPOINT}/${uploadId}/complete`,
        {
            method: 'POST',
            signal
        }
    )

    if (!response.ok) {
        throw new Error(`Upload completion failed with status ${response.status}`)
    }

    const { name, url, embed_url: embedUrl, created_at: createdAt, expires_at: expiresAt } = await response.json()
    return { name, url, embedUrl, createdAt, expiresAt }
}

export async function createUpload(
    file: File,
    expiresIn: number | null,
    signal: AbortSignal
): Promise<CreateUploadResponse> {
    const response = await fetch(`${import.meta.env.VITE_API_ORIGIN}${config.API_UPLOADS_ENDPOINT}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            file_name: file.name,
            file_size: file.size,
            file_mime_type: file.type,
            ...(expiresIn !== null && { file_expires_in: expiresIn })
        }),
        signal
    })

    if (!response.ok) {
        throw new Error(`Upload initialization failed with status ${response.status}`)
    }

    const { id, chunk_size: chunkSize } = await response.json()
    return { id, chunkSize }
}

export async function getUploadState(uploadId: string, signal: AbortSignal): Promise<UploadState | undefined> {
    try {
        const response = await fetch(`${import.meta.env.VITE_API_ORIGIN}${config.API_UPLOADS_ENDPOINT}/${uploadId}`, {
            method: 'GET',
            signal
        })

        if (!response.ok) {
            throw new Error(`Chunk upload failed with status ${response.status}`)
        }

        const { chunk_size: chunkSize, uploaded_chunks: uploadedChunks } = await response.json()
        return { chunkSize, uploadedChunks: new Set<number>(uploadedChunks) }
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

    const response = await fetch(
        `${import.meta.env.VITE_API_ORIGIN}${config.API_UPLOADS_ENDPOINT}/${uploadId}/chunks`,
        {
            method: 'PATCH',
            headers: {
                'Chunk-Index': chunkIndex.toString(),
                'Chunk-Checksum': checksum,
                'Content-Type': 'application/octet-stream'
            },
            body: blob,
            signal
        }
    )

    if (!response.ok) {
        throw new Error(`Chunk upload failed with status ${response.status}`)
    }
}

export async function uploadFile(
    file: File,
    uploadId: string,
    chunkSize: number,
    uploadedChunks: Set<number>,
    signal: AbortSignal,
    onProgress: (progress: number) => void
): Promise<VirtualFile> {
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
