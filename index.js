const express=require('express')
const app = express()
const cors = require('cors')
//const Log=require('./lib/index')
const Users=require('./routes/Users')
const Posts=require('./routes/Posts')
const RelationShips=require('./routes/RelationShips')
const conexionDb=require('./db/index')
require('dotenv').config()
const PORT=process.env.PORT || 3000
app.use(express.json())
app.use(cors())

app.listen(PORT,()=>{
    //conexionDb.connection()
    console.log('listening on port '+PORT)
})
app.use("/users",Users) 
app.use("/posts",Posts) 
app.use("/relationships",RelationShips) 