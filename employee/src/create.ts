import * as AWS from 'aws-sdk';

import { EmployeeCandidate } from "@company/core/src/types/employee";
import EmployeeService from './services/EmployeeService';
import { checkCreateCredentials } from './functions/checkCreateCredentials';
import { BadRequestError } from '@company/core/src/errors';

const create = async (event : any) => {
  const dynamodb = new AWS.DynamoDB.DocumentClient()
  const candidate : EmployeeCandidate = JSON.parse(event.body);

  const employeeService = new EmployeeService(dynamodb, "Employee");
  try {
    checkCreateCredentials(candidate)

    await employeeService.getByUserId(candidate.userId)
    .then(value => {
      if (!!value.Items?.length) {
        throw new BadRequestError("Employee is exist")
      }
    }) 

    return await employeeService.create(candidate)
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
