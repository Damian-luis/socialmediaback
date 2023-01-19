const express=require('express')
const Posts=express.Router()
const posts=require('../controllers/posts.controller')
const verifyToken = require('../jwt/verifyToken')
Posts.post('/addPost/:id',posts.addPosts)
Posts.put('/updatePost/:idUser/:idPublicacion',posts.updatePosts)
Posts.delete('/deletePost/:idUser/:idPublicacion',posts.deletePosts)
Posts.get('/allPosts',posts.getAllPosts)
module.exports=Posts