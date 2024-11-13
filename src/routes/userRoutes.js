import express from 'express';
import { createUsers, getUserDb, getUsers, getUserOrm, getUserOrmById, createUserOrm, updateUser, deleteUser, uploadOneImg, uploadHandler, uploadManyImg, uploadOneHandler, uploadSingleCloud, uploadSingleHandler, uploadManyCloud, uploadManyHandler } from '../controllers/userControllers.js';
import { middlewareToken } from '../config/jwt.js';
import { tryCatch } from '../config/tryCatch.js';
import { upload } from '../config/upload.js';

const userRoutes = express.Router();

// define API get user
userRoutes.get("/get-users", getUsers);
userRoutes.post("/create-user", createUsers);
userRoutes.get("/get-user-db", getUserDb);
userRoutes.get("/get-users-orm", getUserOrm);
userRoutes.get("/get-users-orm/:id", getUserOrmById);
userRoutes.post("/create-user-orm"/* ,middlewareToken */, tryCatch(createUserOrm));
userRoutes.put("/update-user", tryCatch(updateUser));
userRoutes.delete("/delete-user/:user_id", tryCatch(deleteUser));
userRoutes.post("/upload-avatar", uploadOneImg, uploadOneHandler);
userRoutes.post("/upload-multiple-avatar", uploadManyImg, tryCatch(uploadHandler) );
userRoutes.post("/upload-single-cloud",uploadSingleCloud,uploadSingleHandler);
userRoutes.post("/upload-multiple-cloud", uploadManyCloud, tryCatch(uploadManyHandler) );
export default userRoutes;