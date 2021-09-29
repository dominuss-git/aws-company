import * as AWS from 'aws-sdk';

import EmployeeService from './services/EmployeeService';

const deleteById = async (event: any) => {
  const dynamodb = new AWS.DynamoDB.DocumentClient()
  const employeeService = new EmployeeService(dynamodb, "Employee");

  const { id } = event.pathParameters;

  try {
    const value = await employeeService.deleteById(id)

    return {
      statusCode : 200,
      body : JSON.stringify(value)
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
  handler : deleteById
}