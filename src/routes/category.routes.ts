import Router from 'express';
import { createCategory, deleteCategory, getAllCategories, updateCategory } from '../controllers/category/category.controller.js';
import { userAuth } from '../middleware/userAuth.js';
import { adminAuth } from '../middleware/adminAuth.js';


const router = Router();


//Create category router
router.post('/create', userAuth, adminAuth, createCategory);

//Get all categories
router.get('/', getAllCategories);

//Update category
router.patch('/update/:id', userAuth, adminAuth, updateCategory);

//Delete category
router.delete('/delete/:id', userAuth, adminAuth, deleteCategory);


export default router;