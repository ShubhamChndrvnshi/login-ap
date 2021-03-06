const express = require('express');
const authController = require('../controllers/auth')

const router = express.Router();

router.post('/register', authController.register);

router.post('/login', authController.login);

router.post('/update', authController.update);

router.post('/reset', authController.reset);

router.post('/profile', authController.profile);

module.exports = router;