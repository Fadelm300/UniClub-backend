require("dotenv").config();
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");


const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});


const uploadFile = async (fileBuffer, fileName, mimeType) => {
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: fileName,
    Body: fileBuffer,
    ContentType: mimeType,
    ACL: "public-read", // Optional: Make file public
  });

  await s3.send(command);
  return `${process.env.R2_ENDPOINT}/${process.env.R2_BUCKET_NAME}/${fileName}`;
};

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

const getFileUrl = (fileName) => {
  return `${process.env.R2_ENDPOINT}/${process.env.R2_BUCKET_NAME}/${fileName}`;
};

module.exports = { uploadFile, deleteFile, getFileUrl };
