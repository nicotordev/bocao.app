import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2Client, R2_BUCKET_NAME, R2_PUBLIC_URL } from "@/lib/r2";

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

export function validateImageFile(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("INVALID_IMAGE_TYPE");
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error("IMAGE_TOO_LARGE");
  }
}

export async function uploadImageToR2(file: File, keyPrefix: string) {
  validateImageFile(file);

  if (!R2_BUCKET_NAME || !R2_PUBLIC_URL) {
    throw new Error("R2_NOT_CONFIGURED");
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const fileExtension = file.name.split(".").pop() || "jpg";
  const filename = `${keyPrefix}/${crypto.randomUUID()}.${fileExtension}`;

  await r2Client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: filename,
      Body: buffer,
      ContentType: file.type,
    }),
  );

  return `${R2_PUBLIC_URL.replace(/\/$/, "")}/${filename}`;
}
