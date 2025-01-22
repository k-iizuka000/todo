const express = require('express');
const router = express.Router();
const subtaskController = require('../controllers/subtask-controller');

router.post('/generate', subtaskController.generateSubtasks);

module.exports = router; 