export async function hashBlob(blob: Blob, algorithm: AlgorithmIdentifier = 'SHA-256'): Promise<string> {
    const arrayBuffer = await blob.arrayBuffer()
    const hashBuffer = await crypto.subtle.digest(algorithm, arrayBuffer)

    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map((byte) => byte.toString(16).padStart(2, '0')).join('')
}
