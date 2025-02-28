import 'dotenv/config';
import http from 'http';
import app from './app.js';
import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import projectModel from './models/project.model.js';

const port = process.env.PORT || 3000;


const server = http.createServer(app);


const io = new Server(server, {
    cors: {
        origin: '*'
    }
});


io.use(async(socket,next) => {

    try{

        const token = socket.handshake.auth?.token || socket.handshake.headers.authorization?.split(' ')[ 1 ]

        const projectId = socket.handshake.query.projectId

        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            return next(new Error('Invalid projectId'))
        }

        socket.project = await projectModel.findById(projectId)

        if(!token) {
            return next(new Error('Authentication error'))
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET)   
         
        if(!decoded) {
            return next (new Error('Error in decoding'))
        }

        socket.user = decoded

        next()

    }
    catch(error) {
        next(error)
    }
    

})


io.on('connection', socket => {

    socket.roomId = socket.project._id.toString()

    console.log('a user Connected')

    socket.join(socket.roomId)

    socket.on('project-message', data => {

        console.log(data)

        socket.broadcast.to(socket.roomId).emit('project-message', data)
    })

    socket.on('event', data => { /* … */ });
    socket.on('disconnect', () => { /* … */ });
});


server.listen(3000, () => {
    console.log(`Server is running on port ${port}`);
})