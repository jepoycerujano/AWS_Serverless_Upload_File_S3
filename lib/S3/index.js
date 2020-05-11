const AWS = require('aws-sdk');

const s3 = new AWS.S3();

const Logger = require('../Logger');

const { UPLOAD_BUCKET } = process.env;
const getUploadURL = async () => {
  Logger.verbose('getUploadURL started');
  const actionId = Date.now();

  const s3Params = {
    Bucket: UPLOAD_BUCKET,
    Key: `${actionId}.jpg`,
    ContentType: 'image/jpeg',
    CacheControl: 'max-age=31104000',
    //    ACL: 'public-read',   // Optional if you want the object to be publicly readable
  };

  return new Promise((resolve) => {
    // Get signed URL
    const uploadURL = s3.getSignedUrl('putObject', s3Params);
    resolve({
      statusCode: 200,
      isBase64Encoded: false,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        uploadURL,
        photoFilename: `${actionId}.jpg`,
      }),
    });
  });
};


module.exports = getUploadURL;
