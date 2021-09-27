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

    await departmentService.getEmployee(candidate.bossId)
    .then(value => {
      if (!value.Item) {
        throw new BadRequestError("Only employees can create department")
      }

      if (value.Item.departId) {
        throw new BadRequestError("Employee already at department")
      }
    }) 

    return await departmentService.create(candidate)
    .then(value => {
      return {
        statusCode: 201,
        body: JSON.stringify({
          ...value
        })
      }
    })

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
