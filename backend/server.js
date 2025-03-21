import 'dotenv/config';
import http from 'http';
import app from './app.js';
import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import projectModel from './models/project.model.js';
import { generateResult } from './services/ai.service.js';

const port = process.env.PORT || 3000;
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: 'https://ai-enhanced-collaboration-platform-for-8srm.onrender.com',
        methods: ["GET", "POST"]
    }
});

io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth?.token || socket.handshake.headers.authorization?.split(' ')[1];
        const projectId = socket.handshake.query.projectId;

        if (!mongoose.Types.ObjectId.isValid(projectId)) return next(new Error('Invalid projectId'));

        socket.project = await projectModel.findById(projectId);
        if (!token) return next(new Error('Authentication error'));

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded) return next(new Error('Invalid token'));

        socket.user = decoded;
        next();
    } catch (error) {
        next(error);
    }
});

io.on('connection', socket => {
    socket.roomId = socket.project._id.toString();
    console.log('User Connected');

    socket.join(socket.roomId);

    socket.on('project-message', async data => {
        const message = data.message;

        socket.broadcast.to(socket.roomId).emit('project-message', data);

        if (message.includes('@ai')) {
            const result = await generateResult(message.replace('@ai', ''));
            io.to(socket.roomId).emit('project-message', {
                message: result,
                sender: { _id: 'ai', name: 'AI' }
            });
        }
    });

    socket.on('disconnect', () => {
        console.log('User Disconnected');
        socket.leave(socket.roomId);
    });
});

server.listen(port, () => console.log(`Server running on port ${port}`));
