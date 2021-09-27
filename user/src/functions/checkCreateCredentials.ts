import validator from 'validator';

import { Candidate } from '@company/core/src/types/user';
import { BadRequestError } from '@company/core/src/errors';

export const checkCreateCredentials = ({
  firstName, 
  lastName, 
  email, 
  phone,
  } : Candidate ) : void => {
  

  if (validator.isEmpty(lastName)) {
    throw new BadRequestError("lastname is required")
  }

  if (validator.isEmpty(firstName)) {
    throw new BadRequestError("firstname is required")
  }

  if (!validator.isEmail(email)) {
    throw new BadRequestError("email is invalid")
  }

  if (!validator.isMobilePhone(phone)) {
    throw new BadRequestError("phone number is invalid")

  }

} 