const router = require('express').Router();
const auth = require('../middleware/auth');
const { createSlot, listSlots, recommendSlot } = require('../controllers/slotcontroller');

router.post('/', createSlot);
router.get('/', listSlots);
router.post('/recommend', auth, recommendSlot);

module.exports = router;
