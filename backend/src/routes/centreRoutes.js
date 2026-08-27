const router = require('express').Router();
const {
  createCentre,
  listCentres,
  getCentre,
  updateCentreStatus
} = require('../controllers/centercontrol');

router.post('/', createCentre);
router.get('/', listCentres);
router.get('/:id', getCentre);
router.patch('/:id/status', updateCentreStatus);

module.exports = router;
