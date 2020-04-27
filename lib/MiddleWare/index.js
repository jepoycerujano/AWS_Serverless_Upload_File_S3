const middy = require('middy');
const {
  jsonBodyParser,
  httpErrorHandler,
  httpHeaderNormalizer,
} = require('middy/middlewares');

const convertHandler = require('./converHandler');

function middyMiddleware(handler) {
  const middleware = middy(handler);
  middleware
    .use(httpHeaderNormalizer())
    .use(jsonBodyParser())
    .use(httpErrorHandler())
    .use(convertHandler());

  return middleware;
}

module.exports = middyMiddleware;
