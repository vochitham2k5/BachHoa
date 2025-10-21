const { Router } = require('express');
const controller = require('../controllers/userController');
const auth = require('../middleware/auth');

const router = Router();

router.post('/register', controller.register);
router.post('/login', controller.login);
router.get('/me', auth, controller.getProfile);

module.exports = router;