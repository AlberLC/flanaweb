<script setup lang="ts">
import { computed, reactive, ref } from 'vue'

import { config } from '@/config'
import { createUpload, getUploadState, uploadFile } from '@/services/upload_service'
import { UploadStatus } from '@/types/enums'
import type { UploadContext, UploadState } from '@/types/interfaces'

const _expirationSelectItems = [
    { singular: 'segundo', plural: 'segundos', value: 1 },
    { singular: 'minuto', plural: 'minutos', value: 60 },
    { singular: 'hora', plural: 'horas', value: 3600 },
    { singular: 'día', plural: 'días', value: 86400 },
    { singular: 'semana', plural: 'semanas', value: 604800 },
    { singular: 'mes', plural: 'meses', value: 2592000 },
    { singular: 'año', plural: 'años', value: 31104000 }
]
const _files = ref<File[]>([])

const expirationSelectItems = computed(() => {
    const key = Number(expirationValue.value) === 1 ? 'singular' : 'plural'

    return _expirationSelectItems.map((expirationSelectItem) => ({
        title: expirationSelectItem[key],
        value: expirationSelectItem.value
    }))
})
const expirationUnit = ref(86400)
const expirationValue = ref<number | string>(3)
const expirationValueRules = [(value: number | string) => Number(value) >= 0 || 'Valor incorrecto']
const expiresIn = computed(() =>
    hasExpiration.value ? (expirationValue.value as number) * expirationUnit.value : null
)
const files = computed({
    get: () => _files.value,
    set: (newFiles) => {
        const seenFileNames = new Set<string>()
        _files.value = newFiles.filter((file) => (seenFileNames.has(file.name) ? false : seenFileNames.add(file.name)))
    }
})
const hasExpiration = computed(() => typeof expirationValue.value === 'number')
const noVariant = '' as 'outlined'
const snackbar = ref(false)
const uploadContexts = reactive(new Map<File, UploadContext>())
const is_form_valid = ref()

function abortUpload(file: File): void {
    uploadContexts.get(file)?.controller.abort()
}

async function copyFileUrl(file: File): Promise<void> {
    await navigator.clipboard.writeText(uploadContexts.get(file)?.fileUrl!)
    snackbar.value = true
}

function getFileItemColor(file: File): string | undefined {
    switch (uploadContexts.get(file)?.status) {
        case UploadStatus.UPLOADED:
            return 'success'
        case UploadStatus.ERROR:
            return 'error'
    }
}

function isFileItemUploaded(file: File): boolean {
    return uploadContexts.get(file)?.status === UploadStatus.UPLOADED
}

function isFileItemUploading(file: File): boolean {
    return uploadContexts.get(file)?.status === UploadStatus.UPLOADING
}

function isProgressIndeterminate(file: File): boolean {
    return uploadContexts.get(file)?.status === UploadStatus.UPLOADING && uploadContexts.get(file)?.progress === 100
}

function isProgressVisible(file: File): boolean {
    const uploadStatus = uploadContexts.get(file)?.status
    return uploadStatus === UploadStatus.UPLOADING || uploadStatus === UploadStatus.PAUSED
}

function onInput(event: Event): void {
    const input = event.target as HTMLInputElement
    const input_value = input.value.replace(/\D/g, '')

    input.value = input_value
    expirationValue.value = input_value === '' ? '' : Number(input_value)
}

async function removeFile(file: File, remove: () => void): Promise<void> {
    abortUpload(file)
    uploadContexts.delete(file)
    remove()
}

async function uploadAllFileItems(): Promise<void> {
    if (!is_form_valid.value) {
        return
    }

    await Promise.allSettled(files.value.map(uploadFileItem))
}

async function uploadFileItem(file: File): Promise<void> {
    const uploadStatus = uploadContexts.get(file)?.status
    if (uploadStatus === UploadStatus.UPLOADING || uploadStatus === UploadStatus.UPLOADED) {
        return
    }

    const controller = new AbortController()
    let uploadContext = uploadContexts.get(file)

    if (uploadContext) {
        uploadContext.status = UploadStatus.UPLOADING
        uploadContext.controller = controller
    } else {
        uploadContexts.set(file, { status: UploadStatus.UPLOADING, progress: 0, controller })
        uploadContext = uploadContexts.get(file)!
    }

    let uploadState: UploadState | undefined
    let uploadId: string
    let chunkSize: number
    let uploadedChunks: Set<number>

    try {
        if (uploadContext.uploadId) {
            uploadState = await getUploadState(uploadContext.uploadId, controller.signal)
        }

        if (uploadState) {
            uploadId = uploadContext.uploadId!
            chunkSize = uploadState.chunkSize
            uploadedChunks = uploadState.uploadedChunks
        } else {
            const createUploadResponse = await createUpload(file, expiresIn.value, controller.signal)
            uploadId = createUploadResponse.id
            uploadContext.uploadId = uploadId
            chunkSize = createUploadResponse.chunkSize
            uploadedChunks = new Set<number>()
        }

        const virtualFile = await uploadFile(
            file,
            uploadId,
            chunkSize,
            uploadedChunks,
            controller.signal,
            (progress: number) => {
                uploadContext.progress = progress
            }
        )

        uploadContext.status = UploadStatus.UPLOADED
        uploadContext.fileName = virtualFile.name
        uploadContext.fileUrl = `${import.meta.env.VITE_API_ORIGIN}${config.API_BASE_URL}${virtualFile.url}`
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            uploadContext.status = UploadStatus.PAUSED
        } else {
            uploadContext.status = UploadStatus.ERROR
        }
    }
}

async function uploadSingleFileItem(file: File): Promise<void> {
    if (!is_form_valid.value) {
        return
    }

    await uploadFileItem(file)
}
</script>

<template>
    <div class="files-updater">
        <v-file-upload class="file-upload" v-model="files" hide-details multiple>
            <v-file-upload-dropzone
                class="file-upload-dropzone"
                density="comfortable"
                icon="$fileImport"
                scrim="primary"
            />

            <v-form v-show="files.length" class="upload-controls" v-model="is_form_valid">
                <v-text-field
                    class="expiration-value-field"
                    v-model.number="expirationValue"
                    @input="onInput"
                    autocomplete="off"
                    density="comfortable"
                    hide-details
                    hide-spin-buttons
                    inputmode="numeric"
                    :label="hasExpiration ? 'Expira en' : 'Expira'"
                    pattern="[0-9]*"
                    persistent-placeholder
                    placeholder="Nunca"
                    :rules="expirationValueRules"
                    variant="outlined"
                >
                    <template #append-inner>
                        <v-select
                            v-show="hasExpiration"
                            class="expiration-unit-select"
                            :items="expirationSelectItems"
                            v-model="expirationUnit"
                            density="comfortable"
                            hide-details
                            no-auto-scroll
                            :variant="noVariant"
                        />
                    </template>
                </v-text-field>
                <v-btn
                    class="upload-button"
                    @click="uploadAllFileItems"
                    prepend-icon="$cloudUpload"
                    :disabled="!is_form_valid"
                    variant="tonal"
                >
                    Subir todos
                </v-btn>
            </v-form>

            <v-file-upload-list class="file-upload-list" show-size>
                <template #item="{ file, props: itemProps }">
                    <v-file-upload-item :base-color="getFileItemColor(file)" v-bind="itemProps">
                        <template #append>
                            <div v-show="isFileItemUploaded(file)">
                                <v-icon-btn @click="copyFileUrl(file)" color="success" icon="$linkVariant" v-ripple />
                                <a
                                    :href="uploadContexts.get(file)?.fileUrl"
                                    :download="uploadContexts.get(file)?.fileName"
                                >
                                    <v-icon-btn color="success" icon="$download" v-ripple />
                                </a>
                            </div>
                            <div v-show="!isFileItemUploaded(file)">
                                <v-icon-btn
                                    @click="isFileItemUploading(file) ? abortUpload(file) : uploadSingleFileItem(file)"
                                    :color="getFileItemColor(file)"
                                    :icon="isFileItemUploading(file) ? '$pause' : '$cloudUpload'"
                                    v-ripple
                                />
                            </div>
                            <v-icon-btn
                                @click="removeFile(file, itemProps['onClick:remove'])"
                                :color="getFileItemColor(file)"
                                icon="$close"
                                v-ripple
                            />
                        </template>
                        <v-progress-linear
                            :model-value="uploadContexts.get(file)?.progress"
                            absolute
                            :active="isProgressVisible(file)"
                            :indeterminate="isProgressIndeterminate(file)"
                            location="bottom"
                            rounded
                        />
                    </v-file-upload-item>
                </template>
            </v-file-upload-list>
        </v-file-upload>

        <v-snackbar v-model="snackbar" rounded="pill" timeout="2000">Enlace copiado.</v-snackbar>
    </div>
</template>

<style scoped>
.files-updater {
    display: flex;
}

.file-upload,
.file-upload-dropzone {
    flex: 1;
}

.upload-controls {
    display: flex;
    align-items: center;
    align-self: center;
    padding: 50px 0 20px 0;
    gap: 15px;
}

.expiration-value-field :deep(input:not(:placeholder-shown)) {
    text-align: center;
}

.expiration-value-field :deep(.v-field) {
    padding: 0;
    width: 190px;
    font-size: 1.2rem;
}

.expiration-value-field :deep(.v-field__append-inner .v-field__input) {
    padding: 0;
}

.expiration-unit-select {
    width: 120px;
}

.upload-button {
    font-size: 1.2rem;
    padding: 27px 40px 26px 40px;
}

.file-upload-list {
    margin: 0;
    padding: 0;
}
</style>
