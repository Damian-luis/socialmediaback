const express=require('express')
const RelationShips=express.Router()
const relationShips=require('../controllers/relationships.controller')
const verifyToken = require('../jwt/verifyToken')

// Aplicar middleware de verificación de token a todas las rutas
RelationShips.use(verifyToken)

// Rutas de seguimiento
RelationShips.post('/addFollow/:idUser/:idFollowed/:name/:lastname/:mail',relationShips.addFollow)
RelationShips.delete('/deleteFollow/:idFollow',relationShips.deleteFollow)
RelationShips.get('/allFollows/:idUser',relationShips.allFollows)

// Rutas de amistad
RelationShips.get('/status/:userId1/:userId2',relationShips.getFriendshipStatus)
RelationShips.post('/sendRequest',relationShips.sendFriendRequest)
RelationShips.post('/acceptRequest',relationShips.acceptFriendRequest)
RelationShips.post('/rejectRequest',relationShips.rejectFriendRequest)
RelationShips.delete('/removeFriend/:userId1/:userId2',relationShips.removeFriend)

module.exports=RelationShips  