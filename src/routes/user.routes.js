const router = require('express').Router();
const ctrl   = require('../controllers/user.controller');
const { authenticate, authorizeOwner } = require('../middleware/auth.middleware');

router.get('/search',               authenticate,                        ctrl.searchUsers);
router.get('/:id/profile',          authenticate,                        ctrl.getProfile);
router.post('/:id/profile',         authenticate, authorizeOwner,        ctrl.createProfile);
router.patch('/:id/profile',        authenticate, authorizeOwner,        ctrl.updateProfile);
router.get('/:id/settings',         authenticate, authorizeOwner,        ctrl.getSettings);
router.post('/:id/settings',        authenticate, authorizeOwner,        ctrl.createSettings);
router.patch('/:id/settings',       authenticate, authorizeOwner,        ctrl.updateSettings);
router.get('/:id/recommendations',  authenticate, authorizeOwner,        ctrl.getRecommendations);
router.delete('/:id',               authenticate, authorizeOwner,        ctrl.deleteUser);

module.exports = router;
