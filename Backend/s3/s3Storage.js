const { S3Client, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
require("dotenv").config();

const s3Client = new S3Client({
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION || "auto",
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    },
});

const uploadToS3 = async (buffer, key, contentType) => {
    const command = new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: contentType,
    });
    await s3Client.send(command);
    return key;
};

const deleteFromS3 = async (key) => {
    const command = new DeleteObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key,
    });
    await s3Client.send(command);
};

module.exports = { s3Client, uploadToS3, deleteFromS3 };
