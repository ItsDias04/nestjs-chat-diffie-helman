import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
// import { Student, Tutor } from '../Entities/profile.interface';
// import { Subject, SubjectForTutor } from '../Entities/subjects.interfaces';
// import { AddGradesInterface, StudentGrades, SubIdGrId, SubjectGrades, SubjectGroupsForGrades } from '../Entities/grades.interfaces';
// import { GetGroupsInterface, StudentsByFilter, StudentsFilterDTO } from '../Entities/search.interface';
import { User } from '../Entities/User';
@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  
  constructor(private http: HttpClient) { }
  baseApiUrl = 'http://localhost:3000';


  getMe() {
    return this.http.get<User>(`${this.baseApiUrl}/users/me`)
  }

}
