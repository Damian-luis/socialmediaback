const express=require('express')
const Interactions=express.Router()
const interactions=require('../controllers/interactions.controller')
Interactions.put('/reactPost/:idPublicacion/:idUserLiked/:name/:lastname',interactions.react)
Interactions.post('/commentPost/:idPublicacion/:idFriend/:name/:lastname',interactions.postComment)
Interactions.put('/commentUpdate/:idPublicacion/:idComment/:idUser/:name/:lastname',interactions.updateComment)
Interactions.delete('/commentDelete/:idPublicacion/:idComment',interactions.deleteComment)
module.exports=Interactions  