import Joi, { ObjectSchema } from 'joi';

const emailSchema: ObjectSchema = Joi.object().keys({
  email: Joi.string().email().required().messages({
    'string.base': 'Email must be valid',
    'string.required': 'Email must be valid',
    'string.email': 'Invalid email'
  }),
  action: Joi.string().optional()
});

const passwordSchema: ObjectSchema = Joi.object().keys({
  password: Joi.string().required().min(4).max(12).messages({
    'string.base': 'Password must be of type string',
    'string.min': 'Minimum character is 4',
    'string.max': 'Maximum character is 12',
    'string.empty': 'Password must be not empty'
  }),
  confirmPassword: Joi.string().required().valid(Joi.ref('password')).messages({
    'any.only': 'Passwords do not match',
    'any.required': 'Confirm password is a required field'
  }),
  action: Joi.string().optional()
});

const changePasswordSchema: ObjectSchema = Joi.object().keys({
  currentPassword: Joi.string().required().min(4).max(8).messages({
    'string.base': 'Password must be of type string',
    'string.min': 'Minimum character is 4',
    'string.max': 'Maximum character is 12',
    'string.empty': 'Password must be not empty'
  }),
  newPassword: Joi.string().required().invalid(Joi.ref('password')).messages({
    'any.only': 'Passwords should match',
    'any.required': 'Confirm password is a required field'
  })
});

export { emailSchema, passwordSchema, changePasswordSchema };