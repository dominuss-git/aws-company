import * as AWS from 'aws-sdk';

import DepartmentService from './service/DepartmentService';

const top5 = async (event: any) => {
  const dynamodb = new AWS.DynamoDB.DocumentClient()

  const departmentService = new DepartmentService(dynamodb, "Department");

  try {
    return await departmentService.top5()
    .then(value => ({
      statusCode : 200,
      body: JSON.stringify(value)
    }))

  } catch (error) {
    return {
      statusCode: error.code,
      body : JSON.stringify({
        message : error.message
      })
    }
  }
};

module.exports = {
  handler : top5
}