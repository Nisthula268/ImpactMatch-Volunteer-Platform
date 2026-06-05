const express = require('express');
const router  = express.Router();
const {
  register, login, getMe,
  updateProfile, uploadProfilePicture,
} = require('../controllers/authController');
const { protect }                          = require('../middleware/auth');
const { validateRegister, validateLogin }  = require('../middleware/validate');

router.post('/register',        validateRegister, register);
router.post('/login',           validateLogin,    login);
router.get ('/me',              protect,          getMe);
router.put ('/profile',         protect,          updateProfile);
router.post('/upload-picture',  protect,          uploadProfilePicture);

module.exports = router;
