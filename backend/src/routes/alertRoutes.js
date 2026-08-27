const router = require('express').Router();
const auth = require('../middleware/auth');
const { createAlert, myAlerts, markRead } = require('../controllers/alertcontroller');

router.post('/', createAlert);
router.get('/my-alerts', auth, myAlerts);
router.patch('/:id/read', auth, markRead);

module.exports = router;
