import validator from 'validator';

import { BadRequestError } from '@company/core/src/errors';
import { EmployeeCandidate } from '@company/core/src/types/employee';

export const checkCreateCredentials = ({
    departId,
    userId,
    isBoss,
  } : EmployeeCandidate ) : void => {
  

  if (validator.isEmpty(userId)) {
    throw new BadRequestError("User id is required")
  }

  if (isBoss && !departId) {
    throw new BadRequestError("Department id is required")
  }

  if (typeof isBoss !== 'boolean') {
    throw new BadRequestError("isBoss must be boolean")
  }
} 