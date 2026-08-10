import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../config/prisma';
import { generateToken } from '../utils/jwt';
import { sendSuccess, sendError } from '../utils/response';
import { AuthenticatedRequest } from '../types';

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // 1. Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return sendError(res, 'Invalid email or password', undefined, 401);
    }

    // 2. Compare password with hashed password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return sendError(res, 'Invalid email or password', undefined, 401);
    }

    // 3. Generate JWT Token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    // 4. Return sanitized user data and token (never passwordHash)
    return sendSuccess(
      res,
      'Login successful',
      {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      },
      200
    );
  } catch (error) {
    console.error('Login error:', error);
    return sendError(res, 'An error occurred during login', undefined, 500);
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'Authentication required', undefined, 401);
    }

    return sendSuccess(
      res,
      'User profile retrieved successfully',
      {
        user: req.user
      },
      200
    );
  } catch (error) {
    console.error('Get profile error:', error);
    return sendError(res, 'Failed to retrieve profile', undefined, 500);
  }
};
