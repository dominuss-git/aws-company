import * as AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

import { Candidate, User, UserData } from "@company/core/src/types/user";
import { AttributeMap } from 'aws-sdk/clients/dynamodb';
import { BadRequestError } from '@company/core/src/errors';

export default class UserService {
  constructor(
    private dynamodb : AWS.DynamoDB.DocumentClient,
    readonly Table : string
   ) {}

  getByEmail = (email : string) : Promise<AWS.DynamoDB.DocumentClient.QueryOutput> => {
    
    return this.dynamodb.query({
      TableName: this.Table,
      IndexName: "EmailIndex",
      KeyConditionExpression: "email = :email",
      ExpressionAttributeValues: {
        ":email" : email
      }
    })
    .promise()
  }

  createUser = (user : Candidate) : Promise<User> => {
    let newUser : User = {
      ...user,
      id : uuidv4(),
      employeeId : undefined,
      createdAt : new Date().toISOString()
    }
    
    return this.dynamodb.put({
      TableName : this.Table,
      Item : newUser
    })
    .promise()
    .then(() => newUser)

  }

  getAll = () : Promise<AWS.DynamoDB.DocumentClient.QueryOutput> => {
    return this.dynamodb.scan({
      TableName : this.Table
    }).promise()
  }

  getById = async ( id : string ) : Promise<UserData | any>  => {
    let user = (await this.dynamodb.get({
      TableName : this.Table,
      Key : { id }
    }).promise()).Item

    if (!user) {
      throw new BadRequestError("User isn't exist")
    }

    const employee = (await this.dynamodb.get({
      TableName : "Employee",
      Key : { id : user?.employeeId }
    }).promise()).Item

    if (employee?.departId) {
      return await this.dynamodb.get({
        TableName : "Department",
        Key: { id : employee.departId }
      }).promise()
      .then(value => {
        return {
          user,
          department : value.Item
        }
      })
    }

    return user;
  }

  deleteById = async ( id : string ) : Promise<AWS.DynamoDB.DocumentClient.GetItemOutput> => {
    
    const deleted = await this.dynamodb.delete({
      TableName : this.Table,
      Key : { id },
      ReturnValues : "ALL_OLD"
    }).promise()

    if (!deleted || !deleted.Attributes) {
      throw new BadRequestError("User isn't exist")
    }

    if (deleted.Attributes?.employeeId) {
      const del = deleted.Attributes
      await this.dynamodb.delete({
        TableName: "Employee",
        Key : { id : deleted.Attributes.employeeId } 
      }).promise()
      .then(value => {
        return {
          ...del, 
          employeeId : value 
        }
      })
    }

    return deleted
  }

  top5 = async () : Promise<Array<User>> => {
    return await this.dynamodb.scan({
      TableName : this.Table
    }).promise()
    .then(value => {
      let result = value.Items as Array<User>;

      result?.sort((a : User, b : User) => {
        if (b.createdAt < a.createdAt) 
          return -1
        if (b.createdAt > a.createdAt)
          return 1
        return 0 
      })

      return result.splice(0, 5);
    })
    
  }

  deleteByEmail = async ( email : string ) : Promise<UserData | any> => {
    const candidate = await this.dynamodb.query({
      TableName : this.Table,
      IndexName : "EmailIndex",
      KeyConditionExpression: "email = :email",
      ExpressionAttributeValues: {
        ":email" : email
      }
    }).promise()

    if (!candidate || !candidate.Items?.length) {
      throw new BadRequestError("User with this email doesn't exist")
    }

    const deleted = await this.dynamodb.delete({
      TableName : this.Table,
      Key : { id : candidate.Items[0]?.id },
      ReturnValues : "ALL_OLD"
    }).promise()

    if (!deleted || !deleted.Attributes) {
      throw new BadRequestError("User isn't exist")
    }

    return this.dynamodb.delete({
      TableName : "Employee",
      Key : { id : deleted.Attributes?.employeeId }
    }).promise() 
    .then(value => ({ ...deleted, employeeId : value.Attributes}))
  }

  putEmployee = async ( email : string, employeeId : string ) : Promise<AWS.DynamoDB.DocumentClient.GetItemOutput> => {
    const user : AttributeMap = (await this.getByEmail(email)
    .then((value) =>  {
      if(!value || !value.Items?.length) {
        throw new BadRequestError("User with this email doesn't exist") 
      }

      return value.Items[0]
    }))

    return this.dynamodb.put({
      TableName : this.Table,
      Item : {...user, employeeId},
      ReturnValues : "ALL_OLD"
    }).promise()
  }
}