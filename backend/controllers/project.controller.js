import projectModel from '../models/project.model.js'
import * as projectServices from '../services/project.service.js'
import userModel from '../models/user.model.js'
import { validationResult } from 'express-validator'


export const createProject = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { name } = req.body;
        const loggedInUser = await userModel.findOne({ email: req.user.email });

        if (!loggedInUser) {
            return res.status(404).json({ message: "User not found" });
        }

        const userId = loggedInUser._id;

        // Admin object create karna
        const admin = {
            _id: userId,
            name: loggedInUser.name,
            email: loggedInUser.email
        };

        // Project creation ke liye admin ka data pass karna
        const newProject = await projectServices.createProject({ name, admin });

        res.status(201).json(newProject);
    } catch (err) {
        console.log(err);
        res.status(400).send(err.message);
    }
};


export const getAllProject = async (req, res) => {
    try {
        const loggedInUser = await userModel.findOne({
            email: req.user.email
        })

        const allUserProjects = await projectServices.getAllProjectByUserId({
            userId: loggedInUser._id
        })

        return res.status(200).json({
            projects: allUserProjects
        })

    }
    catch (err) {
        console.log(err)
        res.status(400).json({ error: err.message })
    }
}


export const addUsersToProject = async (req, res) => {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
        return req.status(400).json({ errors: errors.array() })
    }

    try {
        const { projectId, users } = req.body

        const loggedInUser = await userModel.findOne({
            email: req.user.email

        })

        const project = await projectServices.addUsersToProject({
            projectId,
            users,
            userId: loggedInUser._id

        })

        return res.status(200).json({
            project,
        })
    }
    catch (err) {
        console.log(err)
        res.status(400).json({ errors: err.message })
    }
}

export const getProjectById = async (req, res) => {

    const { projectId } = req.params;

    try {
        const project = await projectServices.getProjectById({
            projectId
        })
        return res.status(200).json({
            project
        })
    }
    catch( err ) {
        console.log(err)
        res.status(400).json({ error: err.message })
    }
}


export const updateFileTree = async (req, res) => {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    try {
        const { projectId, fileTree } = req.body

        const project = await projectServices.updateFileTree({
            projectId,
            fileTree
        })

        return res.status(200).json({
            project
        })
    }
    catch (err) {
        console.log(err)
        res.status(400).json({ error: err.message })
    }
}