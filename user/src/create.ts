import * as AWS from 'aws-sdk'

import { Candidate } from '@company/core/src/types/user'
import { BadRequestError } from '@company/core/src/errors'
import { checkCreateCredentials } from './functions/checkCreateCredentials'
import UserService from './services/UserService'

const create = async (event: any) => {
  const dynamodb = new AWS.DynamoDB.DocumentClient()
  const candidate : Candidate = JSON.parse(event.body)

  const userService = new UserService(dynamodb, 'User')

  try {
    checkCreateCredentials(candidate)

    const value = await userService.getByEmail(candidate.email)

    if (value.Items?.length) {
      throw new BadRequestError('User with this email is exist')
    }

    const result = await userService.createUser(candidate)

    return {
      statusCode: 201,
      body: JSON.stringify(
        result
      )
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
  handler: create
}
