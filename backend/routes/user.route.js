import { Router } from "express";
import * as userController from '../controllers/user.controller.js';
import { body } from "express-validator";
import * as authMiddleware from '../middleware/auth.middleware.js';

const router = Router();



router.post('/register',
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Email must be valid email address'),
    body('password').isLength({ min: 3 }).withMessage('Password must be atleast 3 characters long'),
    userController.createUserController);

router.post('/login',
    body('email').isEmail().withMessage('Enter valid email address'),
    body('password').isLength({ min: 3 }).withMessage('Enter valid password'),
    userController.loginController);

router.get('/profile', authMiddleware.authUser,
    userController.profileController);

router.get('/logout', authMiddleware.authUser,
    userController.logoutController);

router.get('/all', authMiddleware.authUser,
    userController.getAllUsersController);

export default router;