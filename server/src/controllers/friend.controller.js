const {
  parseSendFriendRequestDTO,
  parseRespondFriendRequestDTO,
} = require('../dtos/friend.dto');
const friendService = require('../services/friend.service');

const getFriends = async (req, res, next) => {
  try {
    const friends = await friendService.getFriends(req.user.uid);
    return res.status(200).json({ friends });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
};

const getFriendRequests = async (req, res, next) => {
  try {
    const requests = await friendService.getFriendRequests(req.user.uid);
    return res.status(200).json({ requests });
  } catch (err) { next(err); }
};

const sendFriendRequest = async (req, res, next) => {
  try {
    const { data, errors } = parseSendFriendRequestDTO(req.body, req.user.uid);
    if (errors.length) return res.status(400).json({ errors });

    const requestId = await friendService.sendFriendRequest(req.user.uid, data.targetUserId);
    return res.status(201).json({ message: 'Friend request sent', requestId });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
};

const respondToRequest = async (req, res, next) => {
  try {
    const { data, errors } = parseRespondFriendRequestDTO(req.body);
    if (errors.length) return res.status(400).json({ errors });

    await friendService.respondToRequest(req.user.uid, req.params.requestId, data.action);
    return res.status(200).json({
      message: data.action ? 'Friend request accepted' : 'Friend request rejected',
    });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
};

const removeFriend = async (req, res, next) => {
  try {
    await friendService.removeFriend(req.user.uid, req.params.friendId);
    return res.status(200).json({ message: 'Friend removed' });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
};

module.exports = { getFriends, getFriendRequests, sendFriendRequest, respondToRequest, removeFriend };
