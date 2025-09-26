import dotenv from 'dotenv';
dotenv.config();
import { createServer } from 'http';
import cors from 'cors';                    // ← add
import app from './src/app.js';
import connectDB from './src/config/db.js';

const PORT = process.env.PORT || 8080;

// Allow Vite dev UI to call the API
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

// IMPORTANT: enable CORS before routes handle requests
app.use(
  cors({
    origin(origin, cb) {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      return cb(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-pin'],
    credentials: false, // set true only if you actually use cookies
    optionsSuccessStatus: 204,
  })
);

// Fast path for preflight
app.options('*', cors());

await connectDB();
const server = createServer(app);

// Bind to 0.0.0.0 so browser can reach it
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Maths-Fact backend listening on http://localhost:${PORT}`);
});
