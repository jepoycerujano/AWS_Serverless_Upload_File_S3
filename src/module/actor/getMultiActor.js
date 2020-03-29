const DDBTable = require('../../../lib/DDBTable/Dynamodb');

const { WORKFLOW_ACTOR_TABLE } = process.env;
const actorsTable = new DDBTable(WORKFLOW_ACTOR_TABLE);

exports.handler = (event, context, callback) => {
  const { body } = event;
  const data = JSON.parse(body);
  console.log(data);
  if (typeof data !== 'object') throw new Error('Opsss! data parameters must be object');
  const { ids = [], fields = [] } = data;

  console.log(`Recieved Object|=>>>${JSON.stringify(data)}`);

  if (!Array.isArray(ids) || ids.length < 1) {
    console.log('Error due to invalid query parameter. Type should be array');
    callback('Error due to invalid query parameter. Type should be array');
    return;
  }
  const params = {
    ids: [...new Set(ids)],
    fields: [...new Set(fields)],
  };

  actorsTable.getMultiItem(params, (error, result) => {
    if (error) throw new Error(`Opsss! error in getting records. Error: ${error}`);
    console.log(JSON.stringify(result));
    callback(null, JSON.stringify(result));
  });
};
