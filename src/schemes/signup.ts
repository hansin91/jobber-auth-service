import Joi, { ObjectSchema } from 'joi';

const signupSchema: ObjectSchema = Joi.object().keys({
  username: Joi.string().alphanum().min(4).max(12).required().messages({
    'string.base': 'Username must be of type string',
    'string.alphanum': 'Username must contain only alphanumeric characters',
    'string.min': 'Minimum character is 4',
    'string.max': 'Maximum character is 12',
    'string.empty': 'Username must be not empty'
  }),
  password: Joi.string().min(4).max(12).required().messages({
    'string.base': 'Password must be of type string',
    'string.min': 'Minimum character is 4',
    'string.max': 'Maximum character is 12',
    'string.empty': 'Password must be not empty'
  }),
  country: Joi.string().required().messages({
    'string.base': 'Country must be of type string',
    'string.empty': 'Country must be not empty'
  }),
  email: Joi.string().email().required().messages({
    'string.base': 'Email must be of type string',
    'string.email': 'Invalid email',
    'string.empty': 'Email must be not empty'
  }),
  profilePicture: Joi.string().required().messages({
    'string.base': 'Please add a profile picture',
    'string.empty': 'Profile picture is required'
  }),
  action: Joi.string().required().messages({
    'string.base': 'Action required'
  })
});

export { signupSchema };