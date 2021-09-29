import * as AWS from 'aws-sdk'

import UserService from './services/UserService'

const getAll = async (event: any) => {
  const dynamodb = new AWS.DynamoDB.DocumentClient()
  const userService = new UserService(dynamodb, 'User')

  try {
    const value = await userService.getAll()

    return {
      statusCode: 200,
      body: JSON.stringify(value.Items)
    }
  } catch (error) {
    return {
      statusCode: error.code,
      body: JSON.stringify({
        message: error.message
      })
    }
  }
}

module.exports = {
  handler: getAll
}
