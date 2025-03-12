import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
    name: {
        type: String,
        lowercase: true,
        required: true,
        trim: true,
        unique: [true, 'Project name already exists']
    },

    admin: {  // Admin field added
        _id: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
        name: { type: String, required: true },
        email: { type: String, required: true }
    },

    users: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user'
        }
    ],
    
    fileTree: {
        type: Object,
        default: {}
    }

    
});

const Project = mongoose.model('project', projectSchema);

export default Project;
