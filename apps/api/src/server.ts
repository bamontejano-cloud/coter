import 'dotenv/config';
import { app } from './app';

const PORT = process.env.PORT ?? 3000;

// Log critical env vars on startup (without exposing secrets)
console.log('Starting server...');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', PORT);
console.log('DATABASE_URL set:', !!process.env.DATABASE_URL);
console.log('JWT_SECRET set:', !!process.env.JWT_SECRET);
console.log('ALLOWED_ORIGIN:', process.env.ALLOWED_ORIGIN ?? '(not set, using default)');

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
