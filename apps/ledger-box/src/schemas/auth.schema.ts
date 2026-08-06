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
    currentPassword: v.pipe(v.string(), v.nonEmpty('validation.password.current.required')),
    newPassword: v.pipe(
      v.string(),
      v.nonEmpty('validation.password.new.required'),
      v.minLength(8, 'validation.password.minLength'),
    ),
    confirmPassword: v.pipe(v.string(), v.nonEmpty('validation.password.confirm.required')),
  }),
  v.forward(
    v.partialCheck(
      [['newPassword'], ['confirmPassword']],
      (input) => input.newPassword === input.confirmPassword,
      'validation.password.mismatch',
    ),
    ['confirmPassword'],
  ),
);
