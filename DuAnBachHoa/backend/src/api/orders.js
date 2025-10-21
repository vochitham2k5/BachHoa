const { Router } = require('express');
const controller = require('../controllers/orderController');
const auth = require('../middleware/auth');

const router = Router();

router.post('/', auth, controller.create);
router.get('/mine', auth, controller.listMine);
router.get('/:id', auth, controller.detail);
router.patch('/:id/status', auth, controller.updateStatus);

module.exports = router;