import * as AWS from 'aws-sdk';

import { BadRequestError } from "@company/core/src/errors";
import DepartmentService from './service/DepartmentService';
import { checkCreateCredentials } from './functions/checkCreateCredentials';
import { CandidateDepartment } from '@company/core/src/types/department';

const create = async (event : any) => {
  const dynamodb = new AWS.DynamoDB.DocumentClient()
  const candidate : CandidateDepartment = JSON.parse(event.body);

  const departmentService = new DepartmentService (dynamodb, "Department");

  try {
    checkCreateCredentials(candidate)

    const employee = await departmentService.getEmployee(candidate.bossId)

    if (!employee.Item) {
      throw new BadRequestError("Only employees can create department")
    }

    if (employee.Item.departId) {
      throw new BadRequestError("Employee already at department")
    }

    const value = await departmentService.create(candidate)

    return {
      statusCode: 201,
      body: JSON.stringify({
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
  handler : create
}
