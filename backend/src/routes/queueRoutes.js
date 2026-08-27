const router = require('express').Router();
const auth = require('../middleware/auth');
const {
  bookToken,
  getTokenStatus,
  updateTokenStatus,
  myTokens
} = require('../controllers/queuecontroller');

router.post('/book', auth, bookToken);
router.get('/my-tokens', auth, myTokens);
router.get('/:id', auth, getTokenStatus);
router.patch('/:id/status', updateTokenStatus);

module.exports = router;
