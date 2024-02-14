const express=require('express')
const app = express()
const cors = require('cors')
const Users=require('./routes/Users')
const Posts=require('./routes/Posts')
const Interactions=require('./routes/Interactions')
const RelationShips=require('./routes/RelationShips')
const conexionDb=require('./db/index')
const morgan = require('morgan');
require('dotenv').config()
const PORT=process.env.PORT || 3000
app.use(express.json())
app.use(morgan('dev'));
app.use(cors())
const fileUpload=require("express-fileupload")
app.use(fileUpload({
    useTempFiles : true,
    tempFileDir : './images'
  }));

app.listen(PORT,()=>{
    //conexionDb.connection()
    console.log('listening on port '+PORT) 
})
app.use("/users",Users) 
app.use("/posts",Posts) 
app.use("/relationships",RelationShips)   
app.use("/interactions",Interactions) 