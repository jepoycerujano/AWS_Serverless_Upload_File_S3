const Dynamo = require('../../../lib/DynamoDB');
const middyMiddleware = require('../../../lib/MiddleWare');
const Logger = require('../../../lib/Logger');

const { WORKFLOW_ACTOR_TABLE } = process.env;
const actorsTable = new Dynamo(WORKFLOW_ACTOR_TABLE);

exports.handler = middyMiddleware((data, context, callback) => {
  actorsTable.deleteItem(data, (error, result) => {
    if (error) {
      Logger.error(JSON.stringify(error));
      callback(null, { statusCode: 500, result: error });
      return;
    }
    callback(null, result);
  });
});
