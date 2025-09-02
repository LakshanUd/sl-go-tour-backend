// routes/UserRoute.js
import express from 'express';
import {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} from '../controllers/UserControllers.js';

const userRouter = express.Router();

userRouter.post('/', createUser);
userRouter.get('/', getAllUsers);
userRouter.get('/:id', getUserById);
userRouter.put('/:id', updateUser);
userRouter.delete('/:id', deleteUser);

export default userRouter;
