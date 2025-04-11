const express = require('express');
const router = express.Router();
const notificationsController = require('../controllers/notifications.controller');

// Obtener notificaciones de un usuario
router.get('/:userId', notificationsController.getUserNotifications);

// Guardar una nueva notificación
router.post('/save', notificationsController.saveNotification);

// Marcar notificaciones como leídas
router.post('/:userId/markAsRead', notificationsController.markAsRead);

module.exports = router; 