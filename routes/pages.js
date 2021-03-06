const express = require('express');

const router = express.Router();

router.get('/', (req, res) => {
    res.render('index');
});

router.get('/register', (req, res) => {
    res.render('register');
});

router.get('/login', (req, res) => {
    res.render('login');
});

router.get('/profile', (req, res) => {
    res.render('profile');
});

router.get('/forgot', (req, res) => {
    res.render('forgot');
});

router.get('/reset', (req, res) => {
    res.render('reset');
});

module.exports = router;