import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(1, 'Username or email is required'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().min(1, 'Phone number is required'),
  dateOfBirth: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date format',
  }),
});

export const appointmentSchema = z.object({
  providerId: z.number().int().positive(),
  appointmentDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date format',
  }),
  appointmentTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  type: z.enum(['individual', 'group', 'family', 'consultation']),
  notes: z.string().optional(),
});

export const moodEntrySchema = z.object({
  moodScore: z.number().int().min(1).max(10),
  anxietyLevel: z.number().int().min(1).max(10).optional(),
  stressLevel: z.number().int().min(1).max(10).optional(),
  sleepHours: z.number().min(0).max(24).optional(),
  notes: z.string().optional(),
  entryDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date format',
  }),
});

export const communityPostSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  content: z.string().min(1, 'Content is required'),
  category: z.string().min(1, 'Category is required'),
  isAnonymous: z.boolean().default(false),
});