const express=require('express')
const app = express()
const socketIo = require('socket.io');
const http = require('http');
const cors = require('cors')
const Users=require('./routes/Users')
const Posts=require('./routes/Posts')
const Interactions=require('./routes/Interactions')
const RelationShips=require('./routes/RelationShips')
const MessagesR=require("./routes/Messages")
const conexionDb=require('./db/index')
const {Messages}=require('./config/db')
const morgan = require('morgan');
const admin = require('firebase-admin');
require('dotenv').config()
const server = http.createServer(app);
const io = require('socket.io')(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST','UPDATE','DELETE'],
  },
});

const PORT=process.env.PORT || 3000
app.use(express.json())
app.use(morgan('dev'));
app.use(cors())
const fileUpload=require("express-fileupload")
app.use(fileUpload({
    useTempFiles : true,
    tempFileDir : './images'
  }));

  const connectedUsers = {};

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  const handlePingPong = () => {
    socket.emit('ping'); 

    
    const pingTimeout = setTimeout(() => {
      console.log(`Socket ${socket.id} no respondió al ping. Desconectando.`);
      socket.disconnect(true);
    }, 5000); 

    
    socket.once('pong', () => {
      clearTimeout(pingTimeout); 
    });
  };

  const pingInterval = setInterval(handlePingPong, 5000)


  socket.on('join', ({ idUser, name }) => {
    if (idUser && name) {
      socket.idUser = idUser;
      socket.name = name;
      connectedUsers[idUser] = socket;
    } else {
     
      console.error(`User with id ${idUser} not authenticated`);
    }

    console.log(`User named ${name} with id: ${idUser} joined the chat`);
  });

  socket.on('private_message', async ({ contenido, para, de }) => {
    console.log(contenido+para+de)
    const destinatario = connectedUsers[para];
  
    if (destinatario) {
      destinatario.emit('private_message', {
        contenido,
        de: { idUser: socket.idUser, name: socket.name },
        para: { idUser: destinatario.idUser, name: destinatario.name },
      });
  
      socket.emit('private_message', {
        contenido,
        de: { idUser: socket.idUser, name: socket.name },
        para: { idUser: destinatario.idUser, name: destinatario.name },
      });
  
      try {
        console.log(socket.idUser)
        console.log(socket.name)
        console.log(de)
        
        const from = de
        const to = destinatario.idUser && destinatario.name ? { idUser: destinatario.idUser, name: destinatario.name } : null;
  
        await Messages.add({
          contenido: contenido,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          from: de,
          to: destinatario.idUser,
        });
  
        console.log('Mensaje guardado en Firebase:', contenido);
      } catch (error) {
        console.error('Error al guardar el mensaje en Firebase:', error);
      }
    } else {
      console.error(`Destinatario with id ${para} not found`);
    }
  }); 
  
  
  
  
  
  

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
    if (socket.idUser) {
      delete connectedUsers[socket.idUser];
    }
    clearInterval(pingInterval)
  });
});



/*app.listen(PORT,()=>{
    //conexionDb.connection()
    console.log('listening on port '+PORT) 
})*/
app.use("/users",Users) 
app.use("/posts",Posts) 
app.use("/relationships",RelationShips)   
app.use("/interactions",Interactions) 
app.use("/messages",MessagesR)
server.listen(PORT, async () => {
  try {
     // await conexionDb.connection();
      console.log('Listening on port ' + PORT);
  } catch (error) {
      console.error('Error connecting to the database:', error);
  }
});