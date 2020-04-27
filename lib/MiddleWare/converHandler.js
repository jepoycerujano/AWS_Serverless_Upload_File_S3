/* eslint-disable no-param-reassign */
const Logger = require('../Logger');

function convertHandler() {
  const dataRecieved = {};
  return ({
    before(handler, next) {
      Logger.silly('calling middleware before');
      const {
        body,
        queryStringParameters,
      } = handler.event;

      if (body !== 'null') {
        if (typeof body !== 'object') {
          return handler.callback(null,
            {
              statusCode: 400,
              result: 'WARNING: Data parameter must be object.',
            });
        }
        Object.assign(dataRecieved, body);
      }

      if (queryStringParameters !== 'null') {
        Object.assign(dataRecieved, queryStringParameters);
      }

      Logger.info(JSON.stringify(dataRecieved));
      handler.event = dataRecieved;
      return next();
    },

    after(handler, next) {
      Logger.silly('calling middleware after');
      const { statusCode = 500, result = {} } = handler.response;
      Logger.debug(JSON.stringify(result));
      handler.response = {
        statusCode,
        body: JSON.stringify(result),
      };
      return next();
    },

    onError(handler, next) {
      Logger.silly('calling middleware error');
      const { error } = handler;
      Logger.error(JSON.stringify(error));
      handler.response = {
        statusCode: 500,
        body: JSON.stringify(
          {
            message: 'ERROR: Internal server.',
            error,
          },
        ),
      };
      return next(error);
    },
  });
}

module.exports = convertHandler;
