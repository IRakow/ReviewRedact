import { Storage } from "@google-cloud/storage"

function getStorage() {
  const keyBase64 = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
  if (!keyBase64) {
    // Fallback: return a mock storage for dev without GCS
    return null
  }
  const credentials = JSON.parse(Buffer.from(keyBase64, "base64").toString())
  return new Storage({
    projectId: process.env.GCS_PROJECT_ID,
    credentials,
  })
}

function getBucket() {
  const storage = getStorage()
  if (!storage) return null
  return storage.bucket(process.env.GCS_BUCKET_NAME!)
}

export async function uploadJSON(path: string, data: unknown): Promise<void> {
  const bucket = getBucket()
  if (!bucket) {
    console.log("[GCS] Mock upload:", path)
    return
  }
  const file = bucket.file(path)
  await file.save(JSON.stringify(data), { contentType: "application/json" })
}

export async function downloadJSON<T = unknown>(path: string): Promise<T> {
  const bucket = getBucket()
  if (!bucket) throw new Error("GCS not configured")
  const file = bucket.file(path)
  const [content] = await file.download()
  return JSON.parse(content.toString()) as T
}

export async function deleteFolder(pathPrefix: string): Promise<void> {
  const bucket = getBucket()
  if (!bucket) return
  await bucket.deleteFiles({ prefix: pathPrefix })
}

export async function getSignedUrl(path: string, expiresMinutes = 60): Promise<string> {
  const bucket = getBucket()
  if (!bucket) throw new Error("GCS not configured")
  const [url] = await bucket.file(path).getSignedUrl({
    action: "read",
    expires: Date.now() + expiresMinutes * 60 * 1000,
  })
  return url
}

export function isGCSConfigured(): boolean {
  return !!process.env.GOOGLE_SERVICE_ACCOUNT_KEY && !!process.env.GCS_BUCKET_NAME
}
