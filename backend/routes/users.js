// ─── Users Routes ─────────────────────────────────────────────────────────────
// Week 5: new entity CRUD.
// Week 6: all user endpoints require authentication (user records, even
// sanitized, are sensitive account data).
// Week 8: verifyToken applied per-route instead of via a path-less
// router.use() — the latter swallowed requests to any unmatched /api/*
// path as a 401 (since it ran for every request reaching this router,
// matched route or not) instead of letting them fall through to the
// global 404 handler.
// Week 8 (security fix): also gated behind requireAdmin. Being logged in
// was previously sufficient to view/edit/delete *any* user's account —
// now this whole router is admin-only account management. Regular users
// manage their own profile via PUT /api/me (see routes/auth.js).

const express = require('express');
const {
  getAllUsersHandler,
  getUserByIdHandler,
  createUserHandler,
  updateUserHandler,
  deleteUserHandler,
} = require('../controllers/usersController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET    /api/users
router.get('/users', verifyToken, requireAdmin, getAllUsersHandler);

// GET    /api/users/:id
router.get('/users/:id', verifyToken, requireAdmin, getUserByIdHandler);

// POST   /api/users
router.post('/users', verifyToken, requireAdmin, createUserHandler);

// PUT    /api/users/:id
router.put('/users/:id', verifyToken, requireAdmin, updateUserHandler);

// DELETE /api/users/:id
router.delete('/users/:id', verifyToken, requireAdmin, deleteUserHandler);

module.exports = router;
