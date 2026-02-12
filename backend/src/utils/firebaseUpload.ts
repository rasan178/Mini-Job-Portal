import { getFirebaseBucket } from "../config/firebase";

const sanitizeFileName = (name: string) => name.replace(/[^a-zA-Z0-9.\-_]/g, "_");

export const uploadPdfToFirebase = async (
  file: Express.Multer.File,
  folder: string
) => {
  const bucket = getFirebaseBucket();
  const safeName = sanitizeFileName(file.originalname);
  const objectPath = `${folder}/${Date.now()}-${safeName}`;
  const bucketFile = bucket.file(objectPath);

  await bucketFile.save(file.buffer, {
    metadata: {
      contentType: file.mimetype,
    },
    resumable: false,
  });

  const [signedUrl] = await bucketFile.getSignedUrl({
    action: "read",
    expires: "03-01-2500",
  });

  return signedUrl;
};
