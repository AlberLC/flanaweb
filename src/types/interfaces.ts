import { UploadStatus } from '@/types/enums'

export interface CreateUploadResponse {
    id: string
    chunkSize: number
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

export interface VirtualFile {
    name: string
    url: string
    embedUrl: string
    createdAt: string
    expiresAt: string | null
}
