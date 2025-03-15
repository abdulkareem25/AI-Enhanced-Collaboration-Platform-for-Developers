import express from "express";
import * as userController from '../controllers/user.controller.js';
import { body } from "express-validator";
import { authUser } from "../middleware/auth.middleware.js";  // ✅ Sirf ek dafa import

const router = express.Router();

// 🟢 Register User Route
router.post('/register',
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Email must be a valid email address'),
    body('password').isLength({ min: 3 }).withMessage('Password must be at least 3 characters long'),
    userController.createUserController
);

// 🟢 Login User Route
router.post('/login',
    body('email').isEmail().withMessage('Enter a valid email address'),
    body('password').isLength({ min: 3 }).withMessage('Enter a valid password'),
    userController.loginController
);

// 🟢 User Profile Route (Protected)
router.get('/profile', authUser, userController.profileController);

// 🟢 Logout Route (Protected)
router.get('/logout', authUser, userController.logoutController);

// 🟢 Get All Users (Protected)
router.get('/all', authUser, userController.getAllUsersController);

// 🟢 Get Current User (`/me` Route) (Protected)
router.get('/me', authUser, userController.meController);

export default router;
