import { UploadStatus } from '@/types/enums'

export interface CreateUploadResponse {
    id: string
    chunkSize: number
}

export interface FileResponse {
    id: string
    name: string
    mimeType: string
    url: string
    embedUrl: string
    thumbnailUrl: string
    width: number | null
    height: number | null
    createdAt: string
    expiresAt: string | null
}

export interface UploadContext {
    uploadId?: string
    status: UploadStatus
    progress: number
    controller: AbortController
    fileName?: string
    fileUrl?: string
}

export interface UploadState {
    chunkSize: number
    uploadedChunks: Set<number>
}
