import * as AWS from 'aws-sdk';

import DepartmentService from './service/DepartmentService';
import { Employee } from '@company/core/src/types/employee';

const removeEmployee = async (event : any) => {
  const dynamodb = new AWS.DynamoDB.DocumentClient();
  const { employeeId } = JSON.parse(event.body);
  const { dep } = event.pathParameters;
  const departmentService = new DepartmentService (dynamodb, "Department");

  try {
    const employee : Employee = await departmentService.deleteEmployee(employeeId)
    const value =  await departmentService.removeEmployee(employee as Employee, dep)
    
    return {
      statusCode : 200,
      body : JSON.stringify({
        ...value
      })
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
  handler : removeEmployee
}