import * as v from 'valibot';

export const loginSchema = v.object({
  email: v.pipe(v.string(), v.trim(), v.nonEmpty('Email is required'), v.email('Enter a valid email address')),
  password: v.pipe(
    v.string(),
    v.nonEmpty('Password is required'),
    v.minLength(8, 'Password must be at least 8 characters'),
  ),
});

export const registerSchema = v.object({
  name: v.pipe(v.string(), v.trim(), v.nonEmpty('Name is required')),
  email: v.pipe(v.string(), v.trim(), v.nonEmpty('Email is required'), v.email('Enter a valid email address')),
  password: v.pipe(
    v.string(),
    v.nonEmpty('Password is required'),
    v.minLength(8, 'Password must be at least 8 characters'),
  ),
});

export const changePasswordSchema = v.pipe(
  v.object({
    currentPassword: v.pipe(v.string(), v.nonEmpty('Current password is required')),
    newPassword: v.pipe(
      v.string(),
      v.nonEmpty('New password is required'),
      v.minLength(8, 'Password must be at least 8 characters'),
    ),
    confirmPassword: v.pipe(v.string(), v.nonEmpty('Please confirm your new password')),
  }),
  v.forward(
    v.partialCheck(
      [['newPassword'], ['confirmPassword']],
      (input) => input.newPassword === input.confirmPassword,
      'Passwords do not match',
    ),
    ['confirmPassword'],
  ),
);
