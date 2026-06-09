import express from 'express';
import path from 'path';
import studentRoutes from './routes/studentRoutes';

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use('/students', studentRoutes);

app.get('/', (req, res) => res.redirect('/students'));

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).send('Что-то пошло не так!');
});

export default app;
