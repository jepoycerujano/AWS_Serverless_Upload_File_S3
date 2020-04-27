const Dynamo = require('../../../lib/DynamoDB');
const middyMiddleware = require('../../../lib/MiddleWare');
const Logger = require('../../../lib/Logger');

const { WORKFLOW_ACTOR_TABLE } = process.env;
const actorsTable = new Dynamo(WORKFLOW_ACTOR_TABLE);

exports.handler = middyMiddleware((data, context, callback) => {
  const { ids = [], fields = [] } = data;

  if (!Array.isArray(ids) || ids.length < 1) {
    Logger.error('ERROR: Invalid query parameter. Type should be array.');
    callback(null, { statusCode: 400, result: 'ERROR: Invalid query parameter. Type should be array.' });
    return;
  }

  const params = {
    ids: [...new Set(ids)],
    fields: [...new Set(fields)],
  };

  actorsTable.getMultiItem(params, (error, result) => {
    if (error) {
      Logger.error(JSON.stringify(error));
      callback(null, { statusCode: 500, result: error });
      return;
    }
    callback(null, result);
  });
});
