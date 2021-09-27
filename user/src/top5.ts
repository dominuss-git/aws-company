import * as AWS from 'aws-sdk';

import UserService from './services/UserService';

const top5 = async (event: any) => {
  const dynamodb = new AWS.DynamoDB.DocumentClient()

  const userService = new UserService(dynamodb, "User");

  try {
    return await userService.top5()

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
  handler : top5
}