require("dotenv").config();
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const crypto = require("crypto");


const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});


const uploadFile = async () => {

  const key = crypto.randomUUID();
  console.log(key);
  const bucket = process.env.R2_BUCKET_NAME;

  const url = await getSignedUrl(s3, new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ACL: "public-read",
  }), { expiresIn: 3600 });

  return { publicUrl: `${process.env.R2_PUBLIC_URL}/${key}` , url, key };
}

const deleteFile = async (fileName) => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: fileName,
    });

    await s3.send(command);
    console.log(`File deleted: ${fileName}`);
    return { success: true, message: `File deleted: ${fileName}` };
  } catch (error) {
    console.error("Error deleting file:", error);
    return { success: false, message: error.message };
  }
};

const getFileUrl = async  (fileName) => {
  const signedUrl = await getSignedUrl
};

module.exports = { uploadFile, deleteFile, getFileUrl };
