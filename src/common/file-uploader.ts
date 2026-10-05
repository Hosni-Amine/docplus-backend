import * as fs from 'fs';
import * as path from 'path';
import { Multer } from 'multer';

function safeFileName(originalname: string) {
  const base = path.basename(originalname).replace(/[^a-zA-Z0-9._-]+/g, '-');
  const random = Math.random().toString(36).slice(2, 8);
  return `${Date.now()}-${random}-${base}`;
}

export async function handleFileUpload(
  files: Multer.File[],
  folder: string,
  subfolder?: string,
): Promise<string[]> {
  try {
    const uploadDir = `uploads/${folder}/${subfolder ?? ''}`;
    await fs.promises.mkdir(uploadDir, { recursive: true });

    return await Promise.all(
      files.map(async (file) => {
        const filePath = `${uploadDir}/${safeFileName(file.originalname)}`;
        await fs.promises.writeFile(filePath, file.buffer);
        return filePath;
      }),
    );
  } catch (error: any) {
    throw new Error(`File upload failed: ${error.message || 'Unknown error'}`);
  }
}

export async function deleteUploadedFile(
  fileUrls: (string | null | undefined)[],
) {
  await Promise.all(
    fileUrls.map(async (fileUrl) => {
      if (!fileUrl) return;

      const relative = fileUrl.replace(/^\//, '');
      if (!relative.startsWith('uploads/') || relative.includes('..')) return;

      try {
        await fs.promises.unlink(relative);
      } catch (error: any) {
        if (error?.code !== 'ENOENT') {
          throw new Error(`
            File delete failed: ${error.message || 'Unknown error'}`);
        }
      }
    }),
  );
}
