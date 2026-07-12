// ─── Users Controller ─────────────────────────────────────────────────────────
// Week 5: new entity. Full CRUD backed by Prisma + PostgreSQL.

const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');

function validateUserBody(body, { partial = false } = {}) {
  const errors = [];

  if (!partial || body.name !== undefined) {
    if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
      errors.push('name is required and must be a non-empty string.');
    }
  }

  if (!partial || body.email !== undefined) {
    if (!body.email || typeof body.email !== 'string' || !body.email.includes('@')) {
      errors.push('email is required and must be a valid email string.');
    }
  }

  if (body.role !== undefined && typeof body.role !== 'string') {
    errors.push('role must be a string.');
  }

  return errors;
}

// Never return password field to clients
function sanitize(user) {
  if (!user) return user;
  const { password, ...safe } = user;
  return safe;
}

/**
 * GET /api/users
 */
async function getAllUsersHandler(req, res, next) {
  try {
    const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
    return res.status(200).json({
      success: true,
      message: 'Users retrieved successfully.',
      count: users.length,
      data: users.map(sanitize),
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/users/:id
 */
async function getUserByIdHandler(req, res, next) {
  try {
    const { id } = req.params;
    if (isNaN(Number(id))) {
      return res.status(400).json({ success: false, message: 'User ID must be a number.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: Number(id) },
      include: { reviews: true },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: `User with ID ${id} not found.` });
    }

    return res.status(200).json({
      success: true,
      message: 'User retrieved successfully.',
      data: sanitize(user),
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /api/users
 */
async function createUserHandler(req, res, next) {
  try {
    const errors = validateUserBody(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: 'Validation failed.', errors });
    }

    const { name, email, password, role } = req.body;
    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

    const user = await prisma.user.create({
      data: {
        name,
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        role: role || 'viewer',
      },
    });

    return res.status(201).json({
      success: true,
      message: 'User created successfully.',
      data: sanitize(user),
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * PUT /api/users/:id
 */
async function updateUserHandler(req, res, next) {
  try {
    const { id } = req.params;
    if (isNaN(Number(id))) {
      return res.status(400).json({ success: false, message: 'User ID must be a number.' });
    }

    const existing = await prisma.user.findUnique({ where: { id: Number(id) } });
    if (!existing) {
      return res.status(404).json({ success: false, message: `User with ID ${id} not found.` });
    }

    const errors = validateUserBody(req.body, { partial: true });
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: 'Validation failed.', errors });
    }

    const data = {};
    ['name', 'role'].forEach((key) => {
      if (req.body[key] !== undefined) data[key] = req.body[key];
    });
    if (req.body.email !== undefined) data.email = req.body.email.trim().toLowerCase();
    if (req.body.password !== undefined) {
      data.password = req.body.password ? await bcrypt.hash(req.body.password, 10) : null;
    }

    const updated = await prisma.user.update({
      where: { id: Number(id) },
      data,
    });

    return res.status(200).json({
      success: true,
      message: 'User updated successfully.',
      data: sanitize(updated),
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * DELETE /api/users/:id
 */
async function deleteUserHandler(req, res, next) {
  try {
    const { id } = req.params;
    if (isNaN(Number(id))) {
      return res.status(400).json({ success: false, message: 'User ID must be a number.' });
    }

    const existing = await prisma.user.findUnique({ where: { id: Number(id) } });
    if (!existing) {
      return res.status(404).json({ success: false, message: `User with ID ${id} not found.` });
    }

    await prisma.user.delete({ where: { id: Number(id) } });
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getAllUsersHandler,
  getUserByIdHandler,
  createUserHandler,
  updateUserHandler,
  deleteUserHandler,
};
