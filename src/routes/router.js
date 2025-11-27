const express = require('express');
const router = express.Router();
const bikeController = require('../controllers/bikeController');

router.get('/bikes', bikeController.getBikes);

module.exports = router;