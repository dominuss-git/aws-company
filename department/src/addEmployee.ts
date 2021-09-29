"use strict";
import * as AWS from 'aws-sdk';

import { BadRequestError } from "@company/core/src/errors";
import DepartmentService from './service/DepartmentService';
import { Employee } from '@company/core/src/types/employee';

const addEmployee = async (event : any) => {
  const dynamodb = new AWS.DynamoDB.DocumentClient();
  const { employeeId } = JSON.parse(event.body);
  const { dep } = event.pathParameters;
  const departmentService = new DepartmentService (dynamodb, "Department");

  try {

    const employee : Employee | AWS.DynamoDB.DocumentClient.GetItemOutput  
    = await departmentService.getEmployee(employeeId)
    // .then(value => {
    if (!employee.Item) {
      throw new BadRequestError("Only employees can create department")
    }

    if (employee.Item.departId) {
      throw new BadRequestError("Employee already at department")
    }

    const value = await departmentService.addEmployee(employee as Employee, dep)

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
  handler : addEmployee
}