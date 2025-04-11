const express = require('express');
const friendshipsRouter = express.Router();
const friendshipsController = require('../controllers/friendships.controller');
const verifyToken = require('../jwt/verifyToken');

// Aplicar middleware de verificación de token a todas las rutas
friendshipsRouter.use(verifyToken);

// Obtener estado de la relación entre dos usuarios
friendshipsRouter.get('/status/:userId1/:userId2', friendshipsController.getFriendshipStatus);

// Enviar solicitud de amistad
friendshipsRouter.post('/sendRequest', friendshipsController.sendFriendRequest);

// Aceptar solicitud de amistad
friendshipsRouter.post('/acceptRequest', friendshipsController.acceptFriendRequest);

// Rechazar solicitud de amistad
friendshipsRouter.post('/rejectRequest', friendshipsController.rejectFriendRequest);

// Eliminar amigo
friendshipsRouter.delete('/removeFriend/:userId1/:userId2', friendshipsController.removeFriend);

module.exports = friendshipsRouter; 