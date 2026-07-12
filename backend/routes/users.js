// ─── Users Routes ─────────────────────────────────────────────────────────────
// Week 5: new entity CRUD.
// Week 6: all user endpoints require authentication (user records, even
// sanitized, are sensitive account data).

const express = require('express');
const {
  getAllUsersHandler,
  getUserByIdHandler,
  createUserHandler,
  updateUserHandler,
  deleteUserHandler,
} = require('../controllers/usersController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.use(verifyToken);

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
