import * as AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

import { Candidate, User, UserData } from '@company/core/src/types/user';
import { BadRequestError } from '@company/core/src/errors';

export default class UserService {
  constructor(
    private dynamodb : AWS.DynamoDB.DocumentClient,
    readonly Table : string,
  ) {}

  getByEmail = (email : string) : Promise<AWS.DynamoDB.DocumentClient.QueryOutput> => this.dynamodb.query({
    TableName: this.Table,
    IndexName: 'EmailIndex',
    KeyConditionExpression: 'email = :email',
    ExpressionAttributeValues: {
      ':email': email,
    },
  })
    .promise()

  createUser = (user : Candidate) : Promise<User> => {
    const newUser : User = {
      ...user,
      id: uuidv4(),
      employeeId: undefined,
      createdAt: new Date().toISOString(),
    };

    return this.dynamodb.put({
      TableName: this.Table,
      Item: newUser,
    })
      .promise()
      .then(() => newUser);
  }

  getAll = () : Promise<AWS.DynamoDB.DocumentClient.QueryOutput> => this.dynamodb.scan({
    TableName: this.Table,
  }).promise()

  getById = async (id : string) : Promise<UserData | any> => {
    const user = (await this.dynamodb.get({
      TableName: this.Table,
      Key: { id },
    }).promise()).Item;

    if (!user) {
      throw new BadRequestError("User isn't exist");
    }

    const employee = (await this.dynamodb.get({
      TableName: 'Employee',
      Key: { id: user?.employeeId },
    }).promise()).Item;

    if (employee?.departId) {
      const value = await this.dynamodb.get({
        TableName: 'Department',
        Key: { id: employee.departId },
      }).promise();

      return {
        user,
        department: value.Item,
      };
    }

    return user;
  }

  deleteById = async (id : string) : Promise<AWS.DynamoDB.DocumentClient.GetItemOutput> => {
    const deleted = await this.dynamodb.delete({
      TableName: this.Table,
      Key: { id },
      ReturnValues: 'ALL_OLD',
    }).promise();

    if (!deleted || !deleted.Attributes) {
      throw new BadRequestError("User isn't exist");
    }

    if (deleted.Attributes?.employeeId) {
      const del = deleted.Attributes;
      const value = await this.dynamodb.delete({
        TableName: 'Employee',
        Key: { id: deleted.Attributes.employeeId },
      }).promise();

      return {
        ...del,
        employeeId: value,
      } as any;
    }

    return deleted;
  }

  top5 = async () : Promise<Array<User>> => {
    const value = await this.dynamodb.scan({
      TableName: this.Table,
    }).promise();

    const result = value.Items as Array<User>;

    result?.sort((a : User, b : User) => {
      if (b.createdAt < a.createdAt) { return -1; }
      if (b.createdAt > a.createdAt) return 1;
      return 0;
    });

    return result.splice(0, 5);
  }

  deleteByEmail = async (email : string) : Promise<UserData | any> => {
    const candidate = await this.dynamodb.query({
      TableName: this.Table,
      IndexName: 'EmailIndex',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email,
      },
    }).promise();

    if (!candidate || !candidate.Items?.length) {
      throw new BadRequestError("User with this email doesn't exist");
    }

    const deleted = await this.dynamodb.delete({
      TableName: this.Table,
      Key: { id: candidate.Items[0]?.id },
      ReturnValues: 'ALL_OLD',
    }).promise();

    if (!deleted || !deleted.Attributes) {
      throw new BadRequestError("User isn't exist");
    }

    const value = await this.dynamodb.delete({
      TableName: 'Employee',
      Key: { id: deleted.Attributes?.employeeId },
    }).promise();

    return {
      ...deleted,
      employeeId: value.Attributes,
    };
  }

  putEmployee = async (email : string, employeeId : string) : Promise<AWS.DynamoDB.DocumentClient.GetItemOutput> => {
    const user : AWS.DynamoDB.DocumentClient.ItemList | undefined = (await this.getByEmail(email)).Items;

    if (!user || !user.length) {
      throw new BadRequestError("User with this email doesn't exist");
    }

    return this.dynamodb.put({
      TableName: this.Table,
      Item: { ...user[0], employeeId },
      ReturnValues: 'ALL_OLD',
    }).promise();
  }
}
