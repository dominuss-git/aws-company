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

    return this.dynamodb.query({
      TableName: "Employee",
      IndexName: "DepartId",
      KeyConditionExpression: "departId = :departId",
      ExpressionAttributeValues: {
        ':departId': employee.Item.departId
      }
    })
    .promise()
    .then(value => {
      return { 
        ...department, 
        employees : value.Items 
      }
    })
  }

  top5 = async () : Promise<Array<Department>> => {
    return this.dynamodb.scan({
      TableName: "Employee"
    }).promise()
    .then(value => {
      let result = (value.Items?.map(entity => entity.departId).reduce((acc, el) => {
        acc[el] = (acc[el] || 0) + 1;
        return acc;
      }, {}));
      
      let promices : Array<Promise<Department>> = [];

      Object.keys(result).sort((key1, key2) => {
        if (result[key2] < result[key1]) 
          return -1
        if (result[key2] > result[key1])
          return 1
        return 0 
      }).slice(0, 5).map((id, index) => {
        promices.push(this.getById(id))
      })

      return Promise.all(promices) as Promise<Array<Department>>;
    })
  }

  deleteEmployee = ( id : string ) : Promise<Employee> => {
    return this.dynamodb.delete({
      TableName : "Employee",
      Key : { id },
      ReturnValues : "ALL_OLD"
    }).promise()
    .then(value => {
      if (!value || !value.Attributes ) {
        throw new BadRequestError("Employee doesn't exist")
      }
      return value.Attributes;
    }) as Promise<Employee>;
  }

  removeEmployee = async(employee : Employee, id : string) : Promise<AWS.DynamoDB.DocumentClient.GetItemOutput | Employee> => {
    await this.dynamodb.update({
      TableName: "User",
      Key: { id : employee.userId },
      UpdateExpression: "set employeeId = :id",
      ExpressionAttributeValues: {
        ':id' : ""
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
    
    let newDepartment : Department = {
      ...candidate,
      id : uuidv4(),
      createdAt : new Date().toISOString()
    }
    
    await this.dynamodb.put({
      TableName : this.Table,
      Item : newDepartment
    })
    .promise()

    return  await this.dynamodb.update({
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
    let deps = (await this.dynamodb.scan({
      TableName : this.Table
    }).promise()).Items

    let task : Array<Promise<any>> = [];

    deps?.map(async(dep, index) => {
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
    let department = (await this.dynamodb.get({
      TableName : this.Table,
      Key : { id }
    }).promise()).Item

    if (!department) {
      throw new BadRequestError("Department isn't exist")
    }
    return this.dynamodb.query({
      TableName : "Employee",
      IndexName : "DepartIndex",
      KeyConditionExpression: "departId = :departId",
      ExpressionAttributeValues: {
        ":departId" : id
      }
    }).promise()
    .then(value => {
      return {department, employee : value.Items}
    })
  }
}