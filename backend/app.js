import express from 'express';
import morgan from 'morgan';
import connect from './db/db.js';
import userRoutes from './routes/user.route.js';
import projectRoutes from './routes/project.route.js';
import aiRoutes from './routes/ai.route.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';

connect(); 

const app = express();

// ✅ Proper CORS Config for Allowed Origins
app.use(cors({ origin: '*', credentials: true }));

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ✅ Secure Headers Middleware
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  next();
});
app.use((req, res, next) => {
    if (req.url === '/favicon.ico') {
      res.status(204).end();
      return;
    }
    next();
  });
app.use(express.static('public'));

// ✅ OPTIONS request ko handle karna zaroori hai (CORS preflight issues prevent karega)
app.options('*', cors());

app.use('/users', userRoutes);
app.use('/projects', projectRoutes);
app.use('/ai', aiRoutes);

app.get('/', (req, res) => {
    res.send('Hello World!');
});

export default app;
