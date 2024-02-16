const express=require('express')
const Messages=express.Router()
const messages=require('../controllers/messages.controller')
const verifyToken = require('../jwt/verifyToken')
Messages.get('/get/:userId',messages.getMessages)
module.exports=Messages  