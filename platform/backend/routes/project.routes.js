const router = require('express').Router();
const authMiddleware = require('../middlewares/auth.middleware');
const { list, getOne, create, update, destroy } = require('../controllers/project.controller');

router.get('/', authMiddleware, list);
router.post('/', authMiddleware, create);
router.get('/:projectId', authMiddleware, getOne);
router.put('/:projectId', authMiddleware, update);
router.delete('/:projectId', authMiddleware, destroy);

module.exports = router;
