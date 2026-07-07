// ─── Users Routes ─────────────────────────────────────────────────────────────
// Week 5: new entity CRUD.

const express = require('express');
const {
  getAllUsersHandler,
  getUserByIdHandler,
  createUserHandler,
  updateUserHandler,
  deleteUserHandler,
} = require('../controllers/usersController');

const router = express.Router();

// GET    /api/users
router.get('/users', getAllUsersHandler);

// GET    /api/users/:id
router.get('/users/:id', getUserByIdHandler);

// POST   /api/users
router.post('/users', createUserHandler);

// PUT    /api/users/:id
router.put('/users/:id', updateUserHandler);

// DELETE /api/users/:id
router.delete('/users/:id', deleteUserHandler);

module.exports = router;
