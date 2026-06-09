import { Request, Response, NextFunction } from 'express';
import { StudentService } from '../services/studentService';
import { StudentFilters, ErrorStatus } from '../types/student';

export class StudentController {
  static async getStudents(
    req: Request<{}, {}, {}, StudentFilters>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const filters = req.query;
      const students = await StudentService.getAllStudents(filters);
      const groups = await StudentService.getAllGroups();

      res.render('index', {
        title: 'Список студентов',
        students,
        groups,
        selectedGroupId: filters.group_id || '',
      });
    } catch (err) {
      next(err);
    }
  }

  static async getStudentProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(ErrorStatus.BAD_REQUEST).send('Некорректный ID');
      }

      const student = await StudentService.getStudentById(id);
      if (!student) {
        return res.status(ErrorStatus.NOT_FOUND).send('Студент не найден');
      }

      res.render('profile', {
        title: `Профиль | ${student.first_name}`,
        student,
      });
    } catch (err) {
      next(err);
    }
  }

  static async renderCreateForm(req: Request, res: Response, next: NextFunction) {
    try {
      const groups = await StudentService.getAllGroups();
      res.render('new', {
        title: 'Добавить студента',
        groups,
      });
    } catch (err) {
      next(err);
    }
  }

  static async createStudent(req: Request, res: Response, next: NextFunction) {
    try {
      const { first_name, last_name, email, group_id, enrollment_year } = req.body;

      if (!first_name || !last_name || !email || !enrollment_year) {
        return res.status(ErrorStatus.BAD_REQUEST).send('Заполните обязательные поля');
      }

      await StudentService.createStudent({
        first_name,
        last_name,
        email,
        group_id: group_id ? parseInt(group_id) : null,
        enrollment_year: parseInt(enrollment_year),
      });

      res.redirect('/students');
    } catch (err) {
      next(err);
    }
  }
}
