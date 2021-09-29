import * as AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

import { BadRequestError } from '@company/core/src/errors';
import { CandidateDepartment, Department, DepartmentData } from '@company/core/src/types/department';
import { Employee } from '@company/core/src/types/employee';

export default class DepartmentService {
  constructor(
    private dynamodb : AWS.DynamoDB.DocumentClient,
    readonly Table : string
   ) {}

  getByBossId = async (id : string) : Promise<DepartmentData | any> => {
    
    const department = (await this.dynamodb.query({
      TableName : this.Table,
      IndexName : "BossIndex",
      KeyConditionExpression: "bossId = :bossId",
      ExpressionAttributeValues: {
        ':bossId' : id
      },
      Limit: 1
    }).promise()).Items

    if (!department?.length) {
      return new Promise((resolve, reject) => resolve(department))
    }

    const employee = await this.dynamodb.get({
      TableName: "Employee",
      Key : { id : id }          
    })
    .promise()

    if (!employee.Item) {
      throw new BadRequestError("Id is required")
    }

    const value = await this.dynamodb.query({
      TableName: "Employee",
      IndexName: "DepartId",
      KeyConditionExpression: "departId = :departId",
      ExpressionAttributeValues: {
        ':departId': employee.Item.departId
      }
    })
    .promise()

    return new Promise(resolve => resolve({ 
      ...department, 
      employees : value.Items 
    }))
  }

  top5 = async () : Promise<Array<Department>> => {
    const value = await this.dynamodb.scan({
      TableName: "Employee"
    }).promise()

    const result = (value.Items?.map(entity => entity.departId).reduce((acc, el) => {
      acc[el] = (acc[el] || 0) + 1;
      return acc;
    }, {}));
      
    const keys = Object.keys(result)

    keys.sort((left, right) => result[right] - result[left])
    const top5Departments = keys.slice(0, 5)
    const promises = top5Departments.map((id) => (this.getById(id)))

    return Promise.all(promises) as Promise<Array<Department>>;
  }

  deleteEmployee = async ( id : string ) : Promise<Employee> => {
    const value = await this.dynamodb.delete({
      TableName : "Employee",
      Key : { id },
      ReturnValues : "ALL_OLD"
    }).promise()

    if (!value || !value.Attributes ) {
      throw new BadRequestError("Employee doesn't exist")
    }

    return new Promise(resolve => resolve(value.Attributes as Employee));
  }

  removeEmployee = async(employee : Employee, id : string) : Promise<AWS.DynamoDB.DocumentClient.GetItemOutput | Employee> => {
    await this.dynamodb.update({
      TableName: "User",
      Key: { id : employee.userId },
      UpdateExpression: "set employeeId = :id",
      ExpressionAttributeValues: {
        ':id' : id
      }
    })

    const department = await this.dynamodb.query({
      TableName: "Employee",
      IndexName: "DepartIndex",
      KeyConditionExpression: "departId = :departId",
      ExpressionAttributeValues: {
        ':departId' : employee.departId
      },
      Limit: 1
    }).promise()

    if (!department.Items?.length) {
      return this.dynamodb.delete({
        TableName: this.Table,
        Key: { id : employee.departId }
      }).promise()
    }

    return employee;
  }

  getEmployee = async (id : string) : Promise<AWS.DynamoDB.DocumentClient.GetItemOutput> => {
    return this.dynamodb.get({
      TableName : "Employee",
      Key : { id }
    }).promise()
  }

  create = async (candidate : CandidateDepartment) : Promise<Department> => {
    
    const newDepartment : Department = {
      ...candidate,
      id : uuidv4(),
      createdAt : new Date().toISOString()
    }
    
    await this.dynamodb.put({
      TableName : this.Table,
      Item : newDepartment
    })
    .promise()

    return this.dynamodb.update({
      TableName: "Employee",
      Key: { id : candidate.bossId },
      UpdateExpression: "set departId = :departId, isBoss = :isBoss",
      ExpressionAttributeValues: {
        ":departId" : newDepartment.id,
        ":isBoss" : true
      }
    }).promise()
    .then(() => newDepartment)
  }

  getAll = async () : Promise<undefined | AWS.DynamoDB.DocumentClient.ItemList> => {
    const deps = (await this.dynamodb.scan({
      TableName : this.Table
    }).promise()).Items

    const task : Array<Promise<any>> = [];

    deps?.map(async(dep) => {
      task.push(this.dynamodb.query({
        TableName: "Employee",
        IndexName: "DepartIndex",
        KeyConditionExpression: "departId = :departId",
        ExpressionAttributeValues: {
          ':departId' : dep.id 
        }
      }).promise()
      .then(value => { 
        return {
          dep, 
          employee : value.Items
        } 
      }))

    })

    return Promise.all(task);
  }

  addEmployee = (employee : Employee, id : string) : Promise<AWS.DynamoDB.DocumentClient.QueryOutput> => {    
    return this.dynamodb.update({
      TableName : "Employee",
      Key : { id : employee.id},
      UpdateExpression : "set departId = :departId",
      ExpressionAttributeValues: {
        ':departId' : id
      },
      ReturnValues: "ALL_NEW"
    })
    .promise()
  }

  getById = async ( id : string ) : Promise<DepartmentData | any>  => {
    const department = (await this.dynamodb.get({
      TableName : this.Table,
      Key : { id }
    }).promise()).Item

    if (!department) {
      throw new BadRequestError("Department isn't exist")
    }
    const value =  await this.dynamodb.query({
      TableName : "Employee",
      IndexName : "DepartIndex",
      KeyConditionExpression: "departId = :departId",
      ExpressionAttributeValues: {
        ":departId" : id
      }
    }).promise()
    return new Promise(resolve => resolve({department, employee : value.Items}))
  }
}