import * as AWS from 'aws-sdk';

import UserService from './services/UserService';

const deleteById = async (event : any) => {
  const dynamodb = new AWS.DynamoDB.DocumentClient()
  const userService = new UserService(dynamodb, "User");

  const { id } = event.pathParameters;

  try {
    return await userService.deleteById(id)
    .then(value => {
      return {
        statusCode : 200,
        body : JSON.stringify(value)
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
  handler : deleteById
}