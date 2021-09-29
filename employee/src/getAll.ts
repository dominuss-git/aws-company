import * as AWS from 'aws-sdk';

import EmployeeService from './services/EmployeeService';

const getAll = async (event: any) => {
  const dynamodb = new AWS.DynamoDB.DocumentClient()
  const employeeService = new EmployeeService(dynamodb, "Employee");

  try {
    const value = await employeeService.getAll()
    
    return {
      statusCode : 200,
      body : JSON.stringify(value.Items)
    }
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
  handler : getAll
}