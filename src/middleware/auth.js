import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

export const authenticate = async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Missing token' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub).lean();
    if (!user) return res.status(401).json({ message: 'Invalid token' });
    req.user = { id: user._id.toString(), role: user.role, name: user.name };
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export const authorizeTaskMutation = ({ creatorId }) => {
  return (req, res, next) => {
    const isAdmin = req.user.role === 'admin';
    const isOwner = req.user.id === creatorId;
    if (isAdmin || isOwner) return next();
    return res.status(403).json({ message: 'Not allowed to modify this task' });
  };
};
