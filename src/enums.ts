import type { ValueOf } from '@/types'

export const UploadStatus = {
    UPLOADING: 'UPLOADING',
    PAUSED: 'PAUSED',
    UPLOADED: 'UPLOADED',
    ERROR: 'ERROR'
} as const

export type UploadStatus = ValueOf<typeof UploadStatus>
