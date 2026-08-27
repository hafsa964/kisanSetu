const router = require('express').Router();
const { dashboardOverview, centreQueueDetail } = require('../controllers/admincontroller');

router.get('/overview', dashboardOverview);
router.get('/centre/:centreId/queue', centreQueueDetail);

module.exports = router;
