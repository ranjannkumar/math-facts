import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import createError from 'http-errors';
import routes from './routes/index.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api', routes);

app.use((req, res, next) => next(createError(404, 'Not Found')));
app.use((err, req, res, next) => {
  console.error(err);
  res
    .status(err.status || 500)
    .json({ error: { message: err.message || 'Server Error' } });
});

export default app;