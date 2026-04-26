const router = require('express').Router();
const ctrl   = require('../controllers/message.controller');
const { authenticate, authorizeOwner } = require('../middleware/auth.middleware');

router.get('/:userId',                  authenticate, authorizeOwner, ctrl.getConversations);
router.get('/:userId/:friendId',        authenticate, authorizeOwner, ctrl.getMessages);
router.post('/:userId',                 authenticate, authorizeOwner, ctrl.sendMessage);
router.patch('/:userId/:messageId',     authenticate, authorizeOwner, ctrl.markAsRead);
router.delete('/:userId',              authenticate, authorizeOwner, ctrl.deleteConversation);

module.exports = router;
