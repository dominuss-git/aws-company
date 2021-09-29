import * as AWS from 'aws-sdk'

import UserService from './services/UserService'

const getById = async (event: any) => {
  const dynamodb = new AWS.DynamoDB.DocumentClient()
  const userService = new UserService(dynamodb, 'User')

  const { id } = event.pathParameters

  try {
    const value = await userService.getById(id)

    return {
      statusCode: 200,
      body: JSON.stringify(value)
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
  handler: getById
}
