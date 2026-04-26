const router = require('express').Router();
const ctrl   = require('../controllers/platform.controller');
const { authenticate, authorizeOwner } = require('../middleware/auth.middleware');

router.get('/supported',                          authenticate,                  ctrl.getSupportedPlatforms);
router.get('/:userId',                            authenticate,                  ctrl.getLinkedPlatforms);
router.post('/:userId/link',                      authenticate, authorizeOwner,  ctrl.linkPlatform);
router.delete('/:userId/:platform',               authenticate, authorizeOwner,  ctrl.unlinkPlatform);
router.get('/:userId/:platform/stats',            authenticate,                  ctrl.getPlatformStats);
router.get('/:userId/:platform/games',            authenticate,                  ctrl.getPlatformGames);
router.get('/:userId/:platform/achievements',     authenticate,                  ctrl.getPlatformAchievements);

module.exports = router;
