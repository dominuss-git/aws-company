import * as AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

import { BadRequestError } from '@company/core/src/errors';
import { Employee, EmployeeCandidate } from '@company/core/src/types/employee';

export default class EmployeeService {
  constructor(
    private dynamodb : AWS.DynamoDB.DocumentClient,
    readonly Table : string
   ) {}

  getByUserId = (userId : string) : Promise<AWS.DynamoDB.DocumentClient.QueryOutput> => {
    
    return this.dynamodb.query({
      TableName: this.Table,
      IndexName: "UserIndex",
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId" : userId
      }
    })
    .promise()
  }

  create = async (employee : EmployeeCandidate) : Promise<Employee> => {
    const user = await this.dynamodb.get({
      TableName: "User",
      Key : { id : employee.userId }
    }).promise()

    if (!user.Item) {
      throw new BadRequestError("User doesn't exist")
    }

    const candidate = await this.getByUserId(employee.userId)

    if (candidate.Items?.length) {
      throw new BadRequestError("Employee exist")
    }
    
    const newEmployee : Employee = {
      ...employee,
      id : uuidv4(),
      addedAt : new Date().toISOString()
    }
    
    return this.dynamodb.put({
      TableName : this.Table,
      Item : newEmployee
    })
    .promise()
    .then(() => newEmployee)
    
  }

  getAll = () : Promise<AWS.DynamoDB.DocumentClient.QueryOutput> => {
    return this.dynamodb.scan({
      TableName : this.Table
    }).promise()
  }

  getById = ( id : string ) : Promise<AWS.DynamoDB.DocumentClient.GetItemOutput> => {
    return this.dynamodb.get({
      TableName : this.Table,
      Key : { id }
    }).promise()
  }

  deleteById = ( id : string ) : Promise<AWS.DynamoDB.DocumentClient.GetItemOutput> => {
    return this.dynamodb.delete({
      TableName : this.Table,
      Key : { id },
      ReturnValues : "ALL_OLD"
    }).promise()
  }
}