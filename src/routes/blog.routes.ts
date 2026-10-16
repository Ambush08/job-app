import { Router } from "express";
import { userAuth } from "../middleware/userAuth.js";
import { adminAuth } from "../middleware/adminAuth.js";
import { createBlog, deleteBlog, getAllBlogs, getBlog, updateBlog } from "../controllers/blog/blog.controller.js";
import upload from "../middleware/multer.js";


const router = Router();


//Create blog route
router.post('/create', userAuth, adminAuth, upload.single('coverImage'), createBlog);


//Read all blogs
router.get('/', getAllBlogs);


//Read a single blog
router.get('/blog/:id', userAuth, getBlog);


//Update blog
router.patch('/update/:id', userAuth, adminAuth, upload.single('coverImage'), updateBlog);


//Delete blog
router.delete('/delete/:id', userAuth, adminAuth, deleteBlog);


export default router;