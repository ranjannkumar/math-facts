import dotenv from 'dotenv';
dotenv.config();
import { createServer } from 'http';
import app from './src/app.js';
import connectDB from './src/config/db.js';

const PORT = process.env.PORT || 8080;

await connectDB();
const server = createServer(app);

server.listen(PORT, () => {
  console.log(`✅ Maths-Fact backend listening on http://localhost:${PORT}`);
});
