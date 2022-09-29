const AWS = require('aws-sdk');
const jwt = require('jsonwebtoken');
const uuid = require("uuid").v4;
var mime = require('mime-types')
var Item = require('../models/item');
const connectToDatabase = require('../db');
const AppError = require('../utils/AppError')

const BUCKET = process.env.BUCKET;

const s3 = new AWS.S3(
  // needed for s3 local
  {
    // s3ForcePathStyle: true,
    // accessKeyId: "S3RVER", // This specific key is required when working offline
    // secretAccessKey: "S3RVER",
    // endpoint: new AWS.Endpoint("http://localhost:4569"),
  }
);

module.exports.upload = async (event) => {
  return manualAuthorization(event)
    .then(() => {
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
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': true,
          },
          body: JSON.stringify({ link: uploadURL })
        }
      } catch (err) {
        throw err
      }
    })
    .catch(err => {
      return {
        statusCode: err.statusCode || 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify({ message: err.message })
      }

    })
}

module.exports.create = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  return manualAuthorization(event)
    .then(() => connectToDatabase())
    .then(() =>
      create(JSON.parse(event.body))
    )
    .then(item => ({
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify(item)
    }))
    .catch(err => ({
      statusCode: err.statusCode || 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({ message: err.message })
    }));
}

async function create(body) {
  try {
    const obj = {
      label: body.label,
      category: body.category,
      image: body.image
    }
    if (body.amount) obj.amount = body.amount;
    if (body.description) obj.description = body.description;

    const newItem = await Item.create(obj);
    return newItem;
  } catch (err) {
    throw new Error(err.message);
  }
}

module.exports.getAll = (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  return connectToDatabase()
    .then(getAll)
    .then(items => ({
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify(items)
    }))
    .catch(err => ({
      statusCode: err.statusCode || 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({ message: err.message })
    }));
};

function getAll() {
  return Item.find({})
    .then(items => items)
    .catch(err => Promise.reject(new Error(err)));
}

module.exports.delete = (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  return manualAuthorization(event)
    .then(() =>
      connectToDatabase()
        .then(async () => {
          const item = await Item.findByIdAndRemove(event.pathParameters.id)
          return {
            statusCode: 200,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Credentials': true,
            },
            body: JSON.stringify({ message: 'Removed item with id: ' + item._id, id: item._id })
          }
        }))
    .catch(err => ({
      statusCode: err.statusCode || 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({ message: err.message })
    }));
};

async function manualAuthorization(event) {
  const token = event.headers['authorization'] || event.headers['Authorization'];
  // console.log('Headers:', event.headers)
  // console.log('Token:', token)

  if (!token)
    throw new AppError("No token specified", 401)

  // verifies secret and checks exp
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err)
      throw new AppError("Invalid token", 401)
  });
}