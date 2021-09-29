import * as AWS from 'aws-sdk';
import DepartmentService from './service/DepartmentService';

const getById = async (event: any) => {
  const dynamodb = new AWS.DynamoDB.DocumentClient()
  const departmentService = new DepartmentService(dynamodb, "Department");
  const { dep } = event.pathParameters
  try {
    const value = await departmentService.getById(dep)
    
    return {
      statusCode : 200,
      body : JSON.stringify({ ...value })
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
  handler : getById
}