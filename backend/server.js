import dotenv from 'dotenv';
dotenv.config();
import { createServer } from 'http';
import cors from 'cors';                    // ← add
import app from './src/app.js';
import connectDB from './src/config/db.js';

import dayjs from 'dayjs'; 
import { sendDailyReport } from './src/services/email.service.js'; 

const PORT = process.env.PORT || 8080;

// Allow Vite dev UI to call the API
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.VERCEL_FRONTEND_URL,
].filter(Boolean);

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


// --- DAILY REPORT SCHEDULING ---
const REPORT_HOUR = 1; // Run the check after 1 AM
let lastRunDate = null; // Track when it last successfully ran

const startDailyReportScheduler = () => {
  const checkAndRun = async () => {
    const now = dayjs();
    const todayFormatted = now.format('YYYY-MM-DD');

    // Only run if it's past 2 AM AND hasn't run today yet
    if (now.hour() >= REPORT_HOUR && lastRunDate !== todayFormatted) {
      console.log(`Attempting scheduled report run for ${todayFormatted}...`);
      try {
        await sendDailyReport();
        lastRunDate = todayFormatted; // Mark as run for today
        console.log('Scheduled report run complete.');
      } catch (error) {
        console.error('Daily report job failed, will try again later.');
        // Note: The error is logged but not re-thrown to keep the server running.
        // lastRunDate is intentionally NOT updated so it retries tomorrow or on the next check.
      }
    }
  };

  // Run the check immediately on startup and then hourly
  checkAndRun();
  // Set an hourly interval.
  setInterval(checkAndRun, 1000 * 60 * 60); 
};

await connectDB();
const server = createServer(app);

// START THE SCHEDULER AFTER DB CONNECTION
startDailyReportScheduler(); // 


// Bind to 0.0.0.0 so browser can reach it
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Maths-Fact backend listening on http://localhost:${PORT}`);
});
