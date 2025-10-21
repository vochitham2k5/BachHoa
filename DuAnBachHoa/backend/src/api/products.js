const { Router } = require('express');
const controller = require('../controllers/productController');
const auth = require('../middleware/auth');

const router = Router();

router.get('/', controller.list);
router.get('/:id', controller.detail);
router.post('/', auth, controller.create);
router.put('/:id', auth, controller.update);
router.delete('/:id', auth, controller.remove);

module.exports = router;