const express=require('express')
const RelationShips=express.Router()
const relationShips=require('../controllers/relationships.controller')
const verifyToken = require('../jwt/verifyToken')
RelationShips.post('/addFollow/:idUser/:idFollowed',relationShips.addFollow)
RelationShips.delete('/deleteFollow/:idFollow',relationShips.deleteFollow)
RelationShips.get('/allFollows',relationShips.allFollows)
module.exports=RelationShips