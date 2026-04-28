const router = require('express').Router();
const ctrl   = require('../controllers/friend.controller');
const { authenticate, authorizeOwner } = require('../middleware/auth.middleware');

router.get('/:userId',                          authenticate,                 ctrl.getFriends);
router.get('/:userId/requests',                 authenticate, authorizeOwner, ctrl.getFriendRequests);
router.post('/:userId/requests',                authenticate, authorizeOwner, ctrl.sendFriendRequest);
router.patch('/:userId/requests/:requestId',    authenticate, authorizeOwner, ctrl.respondToRequest);
router.delete('/:userId/:friendId',             authenticate, authorizeOwner, ctrl.removeFriend);

module.exports = router;
