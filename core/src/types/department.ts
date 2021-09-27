import { Employee } from "./employee";

export interface Department {
  id : string,
  name : string,
  type : string,
  bossId : string,
  createdAt : string
} 

export interface CandidateDepartment {
  name : string,
  type : string,
  bossId : string
}

export interface DepartmentData {
  id : string,
  name : string,
  type : string,
  bossId : string,
  createdAt : string,
  employees : Array<Employee>
}