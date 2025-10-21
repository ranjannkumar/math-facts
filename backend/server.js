import dotenv from 'dotenv';
dotenv.config();
import { createServer } from 'http';
import cors from 'cors';                    
import app from './src/app.js';
import connectDB from './src/config/db.js';

import dayjs from 'dayjs'; 
import { sendDailyReport } from './src/services/email.service.js'; 

// ADD DAYJS CONFIGURATION
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
dayjs.extend(utc);
dayjs.extend(timezone);

const PACIFIC_TIMEZONE = 'America/Los_Angeles'; // US Pacific Time Zone

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

const startDailyReportScheduler = () => {
  const checkAndRun = async () => {
   const now = dayjs().tz(PACIFIC_TIMEZONE);
    
    // Only attempt the run if it's past the scheduled hour. 
    if (now.hour() >= REPORT_HOUR) { 
      console.log(`Attempting scheduled report run for yesterday's data (PST/PDT time: ${now.format('HH:mm')})...`);
      try {
        await sendDailyReport(); 
        console.log('Scheduled report run check complete.');
      } catch (error) {
        console.error('Daily report job failed, will retry later.', error.message);
        // Note: The error is logged but not re-thrown to keep the server running.
      }
    } else {
        console.log(`It's before ${REPORT_HOUR} AM PST/PDT (${now.format('HH:mm')}). Skipping daily report check.`);
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
