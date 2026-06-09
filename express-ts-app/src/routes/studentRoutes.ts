import { Router } from 'express';
import { StudentController } from '../controllers/studentController';

const router = Router();

router.get('/', StudentController.getStudents);
router.get('/new', StudentController.renderCreateForm);
router.get('/:id', StudentController.getStudentProfile);
router.post('/', StudentController.createStudent);

export default router;
