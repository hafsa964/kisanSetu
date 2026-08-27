const router = require('express').Router();
const auth = require('../middleware/auth');
const { register, login, getProfile } = require('../controllers/authentication');

router.post('/register', register);
router.post('/login', login);
router.get('/profile', auth, getProfile);

module.exports = router;
