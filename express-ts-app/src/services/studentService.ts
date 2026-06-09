import { query } from '../config/database';
import { Student, Group, StudentFilters } from '../types/student';

export class StudentService {
  static async getAllStudents(filters: StudentFilters): Promise<Student[]> {
    let sql = `
      SELECT s.*, g.group_name 
      FROM students s
      LEFT JOIN groups g ON s.group_id = g.id
    `;
    const params: any[] = [];

    if (filters.group_id) {
      sql += ' WHERE s.group_id = $1';
      params.push(parseInt(filters.group_id));
    }

    sql += ' ORDER BY s.id DESC';
    const res = await query<Student>(sql, params);
    return res.rows;
  }

  static async getStudentById(id: number): Promise<Student | null> {
    const sql = `
      SELECT s.*, g.group_name 
      FROM students s
      LEFT JOIN groups g ON s.group_id = g.id
      WHERE s.id = $1
    `;
    const res = await query<Student>(sql, [id]);
    return res.rows[0] || null;
  }

  static async getAllGroups(): Promise<Group[]> {
    const res = await query<Group>('SELECT * FROM groups ORDER BY group_name');
    return res.rows;
  }

  static async createStudent(studentData: Omit<Student, 'id'>): Promise<void> {
    const sql = `
      INSERT INTO students (first_name, last_name, email, group_id, enrollment_year)
      VALUES ($1, $2, $3, $4, $5)
    `;
    await query(sql, [
      studentData.first_name,
      studentData.last_name,
      studentData.email,
      studentData.group_id,
      studentData.enrollment_year,
    ]);
  }
}
