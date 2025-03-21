import projectModel from '../models/project.model.js'
import * as projectServices from '../services/project.service.js'
import userModel from '../models/user.model.js'
import { validationResult } from 'express-validator'
import mongoose from 'mongoose'

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

    // ✅ Add validation
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        return res.status(400).json({ error: "Invalid project ID format" });
    }

    try {
        const project = await projectModel.findById(projectId)
            .populate('users')
            .lean();

        if (!project) {
            return res.status(404).json({ error: "Project not found" });
        }

        res.status(200).json({ project });
    } catch (err) {
        console.error("Error in getProjectById:", err);
        res.status(500).json({ error: "Server error" });
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

export const saveMessage = async (req, res) => {
    try {
        const { projectId, sender, message } = req.body;
        
        const project = await projectModel.findByIdAndUpdate(
            projectId,
            {
                $push: {
                    messages: {
                        sender,
                        message,
                        createdAt: new Date()
                    }
                }
            },
            { new: true }
        );

        res.status(200).json(project);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: err.message });
    }
};