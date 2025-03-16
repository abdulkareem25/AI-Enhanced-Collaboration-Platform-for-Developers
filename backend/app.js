import express from 'express';
import morgan from 'morgan';
import path from 'path'; 
import connect from './db/db.js';
import userRoutes from './routes/user.route.js';
import projectRoutes from './routes/project.route.js';
import aiRoutes from './routes/ai.route.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';

connect();

const app = express();

// ✅ Headers Middleware SABSE PEHLE
// app.use((req, res, next) => {
//     res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
//     res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
//     res.setHeader("Cross-Origin-Resource-Policy", "cross-origin"); // Optional
//     res.setHeader("Access-Control-Allow-Origin", "*");
//     res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
//     res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
//     next();
// });

// ✅ Serve React Frontend
const __dirname = path.resolve();
app.use(express.static(path.join(__dirname, 'dist')));

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ✅ Routes
app.use('/users', userRoutes);
app.use('/projects', projectRoutes);
app.use('/ai', aiRoutes);

app.get('/', (req, res) => {
    res.send('Hello World!');
});

export default app;
