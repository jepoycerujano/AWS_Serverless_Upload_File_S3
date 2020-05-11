// const middyMiddleware = require('./lib/MiddleWare');
const Logger = require('./lib/Logger');
const getUploadURL = require('./lib/S3');

exports.uploadImage = async () => {
  Logger.verbose('using lambda');
  const result = await getUploadURL();
  Logger.info(result);
  return result;
};
