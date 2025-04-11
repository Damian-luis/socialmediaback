const express = require('express');
const router = express.Router();
const photosController = require('../controllers/photos.controller');

router.post('/upload/:name/:lastname/:idUser', photosController.uploadPhotos);

module.exports = router; 