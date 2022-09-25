const AWS = require('aws-sdk');
const uuid = require("uuid").v4;
var mime = require('mime-types')

const BUCKET = process.env.BUCKET;

const s3 = new AWS.S3(
  // needed for config
  {
    s3ForcePathStyle: true,
    accessKeyId: "S3RVER", // This specific key is required when working offline
    secretAccessKey: "S3RVER",
    endpoint: new AWS.Endpoint("http://localhost:4569"),
  }
);

module.exports.upload = async (event) => {
  try {
    // const { filename, data } = extractFile(event)
    // await s3.putObject({ Bucket: BUCKET, Key: filename, ACL: 'public-read', Body: data }).promise();
    const eventBody = JSON.parse(event.body);
    const filename = eventBody.filename;
    const ext = filename.split('.').pop();
    const uid = `${uuid()}.${ext}`;
    const mimeType = mime.lookup(filename)

    const s3Params = {
      Bucket: BUCKET,
      Key: uid,
      ContentType: mimeType,
      CacheControl: 'max-age=31557600',
      ACL: 'public-read',
    }
    let uploadURL = s3.getSignedUrl('putObject', s3Params)

    return {
      statusCode: 200,
      body: JSON.stringify({ link: uploadURL })
    }
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: err.stack })
    }
  }
}
