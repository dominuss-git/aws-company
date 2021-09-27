export interface Employee {
  id : string,
  addedAt : string,
  userId : string,
  departId : string | undefined,
  isBoss : boolean
}

export interface EmployeeCandidate {
  userId : string,
  departId : string | undefined,
  isBoss : boolean
}