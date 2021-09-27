import { Employee } from "./employee";

export interface User {
  id : string,
  lastName : string,
  firstName : string,
  email : string,
  phone : string,
  createdAt : string,
  employeeId : string | undefined
}

export interface UserData {
  id : string,
  lastName : string,
  firstName : string,
  email : string,
  phone : string,
  createdAt : string,
  employeeId : Employee | undefined
}


export interface Candidate {
  lastName : string,
  firstName : string,
  email : string,
  phone : string
}