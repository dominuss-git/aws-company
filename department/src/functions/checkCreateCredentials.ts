import validator from 'validator';

import { BadRequestError } from '@company/core/src/errors';
import { CandidateDepartment } from '@company/core/src/types/department';

export const checkCreateCredentials = ({
    bossId,
    name,
    type,
  } : CandidateDepartment ) : void => {
  

  if (validator.isEmpty(bossId)) {
    throw new BadRequestError("Boss id is required")
  }

  if (validator.isEmpty(name)) {
    throw new BadRequestError("Name is required")
  }

  if (validator.isEmpty(type)) {
    throw new BadRequestError("Type is required")
  }
} 