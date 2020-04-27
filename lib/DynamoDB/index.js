const moment = require('moment');
const { DynamoDB } = require('aws-sdk');

const { AWS_ENDPOINT_URL } = process.env;
const ddbClient = new DynamoDB({ endpoint: AWS_ENDPOINT_URL });
const Logger = require('../Logger');

function createUpdateObj(data) {
  const ExpressionAttributeNames = {};
  const ExpressionAttributeValues = {};
  const UpdateExpArray = [];

  const dataKeys = Object.keys(data);
  dataKeys.forEach((key) => {
    if (typeof data[key] === 'undefined') return;

    // Skip keys
    if (key === 'id') return;

    Object.assign(ExpressionAttributeNames, {
      [`#updateExp_${key}`]: key,
    });

    Object.assign(ExpressionAttributeValues, {
      [`:updateExp_${key}`]: DynamoDB.Converter.marshall({
        value: data[key],
      }).value,
    });

    UpdateExpArray.push(`#updateExp_${key} = :updateExp_${key}`);
  });

  const UpdateExpression = `SET ${UpdateExpArray.join(', ')}`;
  return {
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    UpdateExpression,
  };
}

class Dynamo {
  constructor(name) {
    if (typeof name !== 'string') throw new Error('WARNING: Table name must be a string.');
    Object.defineProperties(this, {
      name: {
        value: name,
      },
      client: {
        value: ddbClient,
      },
    });
  }

  /**
   * Gets data from the database
   * @param {String} id - record id
   * @param {Number} version - version number (optional)
   * @param {Function} callback - function(err, record) - provides the record from DB
   */
  getItem({ id }, ...args) {
    const callback = args.pop();
    this.getRecordById(id)
      .then((record) => callback(null, { statusCode: 200, result: record }))
      .catch((e) => callback(e, { statusCode: 500, result: e }));
  }

  /**
   * Gets data from the database
   * @param {String} id - record id
   * @param {String} columns - columns
   * @returns {Promise}
   */
  async getRecordById(id, columns) {
    return new Promise((resolve, reject) => {
      const params = (() => {
        const query = {
          TableName: this.name,
          Limit: 1,
          KeyConditionExpression: 'id = :data',
          ExpressionAttributeValues: {
            ':data': {
              S: id,
            },
          },
        };

        if (!columns) {
          return query;
        }

        return {
          ...query,
          ProjectionExpression: columns,
        };
      })();

      ddbClient.query(params, (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        const {
          Count,
          Items,
        } = result;
        if (Count < 1) {
          resolve('No Record Found');
          return;
        }
        const record = DynamoDB.Converter.unmarshall(Items[0]);
        resolve(record);
      });
    });
  }

  /**
   * Gets data from the database
   * @param {Array<String>} ids - record ids
   * @param {Array<String>} fields - record fields
   * @param {Function} callback - function(err, record) - provides the record from DB
   */
  async getMultiItem({ ids = [], fields = [] }, ...args) {
    const callback = args.pop();

    if (!Array.isArray(ids)) {
      Logger.warning('WARNING: Invalid query parameter. Type should be array.');
      callback(null, { statusCode: 400, result: 'WARNING: Invalid query parameter. Type should be array.' });
      return;
    }

    try {
      const results = await Promise.all(ids.map(async (id) => {
        const record = await this.getRecordById(id, fields.join(','));

        return {
          [id]: (() => {
            if (typeof record === 'string') {
              return {
                status: 400,
                result: record,
              };
            }
            return record;
          })(),
        };
      }));
      callback(null, { statusCode: 200, result: Object.assign({}, ...results) });
    } catch (error) {
      callback(null, { statusCode: 500, result: error });
    }
  }

  /**
   * Inserts records to DB
   * @param {Object} data - data object
   * @param {Function} callback - function(err, result) - provides response from database
   */
  insertItem(data, callback) {
    const now = moment().valueOf();
    const item = {
      ...data,
    };
    if (item.created_at == null) item.created_at = now;
    if (item.updated_at == null) item.updated_at = now;

    const params = {
      TableName: this.name,
      Item: DynamoDB.Converter.marshall(item),
      ConditionExpression: 'attribute_not_exists(id)',
      ReturnConsumedCapacity: 'TOTAL',
    };
    ddbClient.putItem(params, (err, result) => {
      if (err) {
        Logger.error(JSON.stringify(err));
        callback(null, { statusCode: 500, result: err });
        return;
      }
      callback(null, { statusCode: 200, result });
    });
  }

  /**
   * Updates records in DB
   * @param {Object} data - data object must contain id, and keys to be updated
   * @param {Function} callback - function(err, result) - provides response from database
   */
  updateItem(data, callback) {
    this.getItem(data, (err, record) => {
      if (err) {
        Logger.error(JSON.stringify(err));
        callback(null, { statusCode: 500, result: err });
        return;
      }

      if (!record) {
        Logger.warning('WARNING: No records found.');
        callback(null, { statusCode: 400, result: 'WARNING: No records found.' });
        return;
      }

      const oldRecord = {
        ...record,
      };

      const newRecord = {
        ...data,
      };

      const now = moment().valueOf();
      newRecord.created_by = oldRecord.created_by;
      if (newRecord.created_at == null) newRecord.created_at = oldRecord.created_at || now;
      if (newRecord.updated_at == null) newRecord.updated_at = now;

      const {
        ExpressionAttributeNames,
        ExpressionAttributeValues,
        UpdateExpression,
      } = createUpdateObj(newRecord);

      const params = {
        ReturnConsumedCapacity: 'TOTAL',
        TransactItems: [{
          Update: {
            TableName: this.name,
            ConditionExpression: 'attribute_exists(id)',
            ReturnValuesOnConditionCheckFailure: 'ALL_OLD',
            ExpressionAttributeNames,
            ExpressionAttributeValues,
            Key: {
              id: {
                S: newRecord.id,
              },
            },
            UpdateExpression,
          },
        }],
      };

      ddbClient.transactWriteItems(params, (error, result) => {
        if (error) {
          Logger.error(JSON.stringify(error));
          callback(null, { statusCode: 500, result: error });
          return;
        }
        callback(null, { statusCode: 200, result });
      });
    });
  }

  /**
   * Delete records to DB
   * @param {Object} data - data object
   * @param {Function} callback - function(err, result) - provides response from database
   */
  deleteItem({ id }, callback) {
    const params = {
      TableName: this.name,
      Key: {
        id: {
          S: String(id),
        },
      },
      ConditionExpression: 'attribute_exists(id)',
      ReturnValues: 'NONE', // optional (NONE | ALL_OLD)
      ReturnConsumedCapacity: 'TOTAL', // optional (NONE | TOTAL | INDEXES)
      ReturnItemCollectionMetrics: 'SIZE', // optional (NONE | SIZE)
    };

    ddbClient.deleteItem(params, (error, result) => {
      if (error) {
        Logger.error(JSON.stringify(error));
        callback(null, { statusCode: 500, result: error });
        return;
      }
      callback(null, { statusCode: 200, result });
    });
  }
}

module.exports = Dynamo;
