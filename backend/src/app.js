import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import compression from 'compression';
import createError from 'http-errors';
import routes from './routes/index.js';

const app = express();

const allowedOrigin =
  process.env.VERCEL_FRONTEND_URL || 'http://localhost:5173';

app.use(cors({
  origin: allowedOrigin,
  credentials: false, // set true only if you actually use cookies/auth headers that require it
}));
app.use(express.json());
// Enable gzip/deflate to reduce payload sizes
app.use(compression());
// Only log in development to avoid slow console I/O on hosts
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

app.use('/api', routes);

app.use((req, res, next) => next(createError(404, 'Not Found')));
app.use((err, req, res, next) => {
  console.error(err);
  res
    .status(err.status || 500)
    .json({ error: { message: err.message || 'Server Error' } });
});

export default app;
