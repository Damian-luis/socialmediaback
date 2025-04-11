const express = require('express')
const app = express()
const socketIo = require('socket.io');
const http = require('http');
const cors = require('cors')
const Users = require('./routes/Users')
const Posts = require('./routes/Posts')
const Photos = require('./routes/photos.routes')
const Interactions = require('./routes/Interactions')
const RelationShips = require('./routes/RelationShips')
const MessagesR = require("./routes/Messages")
const Friendships = require('./routes/friendships.routes')
const { Messages, Post, User, RelationShip } = require('./config/db')
const morgan = require('morgan');
const admin = require('firebase-admin');
require('dotenv').config()
const server = http.createServer(app);
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const { credential } = require('firebase-admin');
const serviceAccount = require('./config/key.json');
const { Server } = require('socket.io');
const notificationsRoutes = require('./routes/notifications.routes');

// Inicializar Firebase Admin (solo una vez)
if (!admin.apps.length) {
  initializeApp({
    credential: credential.cert(serviceAccount),
    storageBucket: "socialmedia-4c55d.appspot.com"
  });
}

// Configuración de CORS para Express
app.use(cors({
  origin: process.env.REACT_APP_URL_FRONTEND || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Configuración de Socket.IO con opciones más robustas
const io = new Server(server, {
  cors: {
    origin: process.env.REACT_APP_URL_FRONTEND || 'http://localhost:3002',
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});

const PORT = process.env.PORT || 3007
app.use(express.json())
app.use(morgan('dev'));
const fileUpload = require("express-fileupload")
app.use(fileUpload({
  useTempFiles: false,
  tempFileDir: '/tmp/',
  limits: { fileSize: 32 * 1024 * 1024 }, // 32MB max file size
  debug: true, // Activar logs de debug temporalmente
  preserveExtension: true,
  abortOnLimit: true,
  safeFileNames: true,
  createParentPath: true
}));

// Almacenamiento de usuarios conectados y sus sockets
const connectedUsers = new Map();
const userSockets = new Map();

// Middleware para logging de eventos de socket
const socketLogger = (socket, next) => {
  console.log(`[${new Date().toISOString()}] Nueva conexión socket: ${socket.id}`);
  next();
};

io.use(socketLogger);

io.on('connection', (socket) => {
  console.log('Usuario conectado:', socket.id);

  // Manejar evento join
  socket.on('join', ({ idUser, name }) => {
    if (!idUser || !name) {
      console.error(`Intento de conexión sin identificación completa: ${socket.id}`);
      return;
    }

    console.log(`[${new Date().toISOString()}] Usuario ${name} (${idUser}) se unió`);

    // Guardar información del usuario
      socket.idUser = idUser;
      socket.name = name;
    
    // Actualizar mapas de usuarios
    connectedUsers.set(idUser, { id: idUser, name, socketId: socket.id });
    
    // Manejar múltiples conexiones del mismo usuario
    if (!userSockets.has(idUser)) {
      userSockets.set(idUser, new Set());
    }
    userSockets.get(idUser).add(socket.id);

    // Notificar a todos los usuarios conectados
    const onlineUsers = Array.from(connectedUsers.keys());
    io.emit('online_users', onlineUsers);
    socket.broadcast.emit('user_connected', { idUser, name });

    // Enviar mensajes pendientes si los hay
    socket.emit('get_online_users', onlineUsers);
  });

  // Manejar ping personalizado
  socket.on('ping', (data) => {
    socket.emit('pong');
  });

  // Manejar mensajes privados
  socket.on('private_message', async (data) => {
    console.log(`[${new Date().toISOString()}] Datos del mensaje recibido:`, JSON.stringify(data, null, 2));

    try {
      // Validar que todos los campos necesarios estén presentes
      if (!data || typeof data !== 'object') {
        throw new Error('Datos del mensaje inválidos');
      }

      const { contenido, para, de } = data;
      
      if (!contenido || !para || !de) {
        console.error('Campos faltantes:', {
          contenido: !!contenido,
          para: !!para,
          de: !!de
        });
        throw new Error('Faltan campos requeridos en el mensaje');
      }

      // Verificar que el destinatario existe
      const recipientDoc = await User.doc(para).get();
      if (!recipientDoc.exists) {
        throw new Error('El destinatario no existe');
      }

      // Guardar mensaje en Firebase
      const messageRef = await Messages.add({
        contenido,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        from: de,
        to: para,
        seen: false,
        timestamp: data.timestamp || new Date().toISOString()
      });

      const messageData = {
        id: messageRef.id,
        contenido,
        de,
        para,
        timestamp: data.timestamp || new Date().toISOString(),
        seen: false
      };

      // Enviar mensaje solo a los sockets del destinatario
      if (userSockets.has(para)) {
        const destinationSockets = userSockets.get(para);
        destinationSockets.forEach(socketId => {
          io.to(socketId).emit('private_message', messageData);
        });
      }

      // Enviar confirmación al remitente
      socket.emit('message_sent', { 
        success: true, 
        messageId: messageRef.id,
        timestamp: messageData.timestamp
      });

    } catch (error) {
      console.error('Error al procesar mensaje:', error);
      socket.emit('error', { 
        message: error.message || 'Error al enviar mensaje',
        code: 'MESSAGE_ERROR'
      });
    }
  });

  // Manejar solicitud de usuarios en línea
  socket.on('get_online_users', () => {
    const onlineUsers = Array.from(connectedUsers.keys());
    socket.emit('online_users', onlineUsers);
  });

  // Manejar estado de escritura
  socket.on('typing', ({ userId, isTyping }) => {
    if (userSockets.has(userId)) {
      const destinationSockets = userSockets.get(userId);
      destinationSockets.forEach(socketId => {
        io.to(socketId).emit('user_typing', { userId: socket.idUser, isTyping });
      });
    }
  });

  // Manejar desconexión
  socket.on('disconnect', (reason) => {
    console.log(`[${new Date().toISOString()}] Socket desconectado: ${socket.id}, razón: ${reason}`);

    if (socket.idUser) {
      // Eliminar socket del conjunto de sockets del usuario
      if (userSockets.has(socket.idUser)) {
        const userSocketSet = userSockets.get(socket.idUser);
        userSocketSet.delete(socket.id);

        // Si no quedan sockets para este usuario, eliminar usuario de la lista de conectados
        if (userSocketSet.size === 0) {
          userSockets.delete(socket.idUser);
          connectedUsers.delete(socket.idUser);
          io.emit('user_disconnected', { idUser: socket.idUser });
          
          // Emitir lista actualizada de usuarios en línea
          const onlineUsers = Array.from(connectedUsers.keys());
          io.emit('online_users', onlineUsers);
        }
      }
    }
  });

  // Evento para enviar solicitud de amistad
  socket.on('send_friend_request', async (data) => {
    try {
      const { senderId, receiverId } = data;
      
      // Verificar si ya existe una relación
      const existingFriendship = await RelationShip
        .where('senderId', 'in', [senderId, receiverId])
        .where('receiverId', 'in', [senderId, receiverId])
        .limit(1)
        .get();

      if (!existingFriendship.empty) {
        socket.emit('friend_request_error', {
          message: 'Ya existe una relación entre estos usuarios'
        });
        return;
      }

      // Crear nueva solicitud de amistad
      const friendshipRef = await RelationShip.add({
        senderId,
        receiverId,
        status: 'pending',
        timestamp: new Date()
      });

      // Obtener datos del remitente
      const senderDoc = await User.doc(senderId).get();
      const senderData = senderDoc.data();

      // Emitir evento al remitente
      socket.emit('friend_request_sent', {
        status: true,
        message: 'Solicitud de amistad enviada'
      });

      // Emitir evento al receptor si está en línea
      if (userSockets.has(receiverId)) {
        const receiverSockets = userSockets.get(receiverId);
        receiverSockets.forEach(socketId => {
          io.to(socketId).emit('friend_request_received', {
            requestId: friendshipRef.id,
            sender: {
              id: senderId,
              name: senderData.name,
              lastname: senderData.lastname,
              urlProfile: senderData.urlProfile
            },
            timestamp: new Date().toISOString()
          });
        });
      }
      } catch (error) {
      console.error('Error sending friend request:', error);
      socket.emit('friend_request_error', {
        message: 'Error al enviar la solicitud de amistad'
      });
    }
  });

  // Evento para aceptar solicitud de amistad
  socket.on('accept_friend_request', async ({ requestId, receiverId }) => {
    try {
      const requestDoc = await RelationShip.doc(requestId).get();
      if (requestDoc.exists) {
        const senderId = requestDoc.data().senderId;
        // Notificar al remitente si está en línea
        if (userSockets.has(senderId)) {
          const senderSockets = userSockets.get(senderId);
          senderSockets.forEach(socketId => {
            io.to(socketId).emit('friend_request_accepted', {
              receiverId,
              timestamp: new Date().toISOString()
            });
          });
        }
      }
    } catch (error) {
      console.error('Error al aceptar solicitud de amistad:', error);
      socket.emit('error', { message: 'Error al aceptar solicitud de amistad' });
    }
  });

  // Evento para rechazar solicitud de amistad
  socket.on('reject_friend_request', async ({ requestId, receiverId }) => {
    try {
      const requestDoc = await RelationShip.doc(requestId).get();
      if (requestDoc.exists) {
        const senderId = requestDoc.data().senderId;
        // Notificar al remitente si está en línea
        if (userSockets.has(senderId)) {
          const senderSockets = userSockets.get(senderId);
          senderSockets.forEach(socketId => {
            io.to(socketId).emit('friend_request_rejected', {
              receiverId,
              timestamp: new Date().toISOString()
            });
          });
        }
      }
    } catch (error) {
      console.error('Error al rechazar solicitud de amistad:', error);
      socket.emit('error', { message: 'Error al rechazar solicitud de amistad' });
    }
  });

  // Evento para eliminar amigo
  socket.on('remove_friend', async ({ userId1, userId2 }) => {
    try {
      // Notificar al otro usuario si está en línea
      const otherUserId = userId1 === socket.idUser ? userId2 : userId1;
      if (userSockets.has(otherUserId)) {
        const otherUserSockets = userSockets.get(otherUserId);
        otherUserSockets.forEach(socketId => {
          io.to(socketId).emit('friend_removed', {
            userId: socket.idUser,
            timestamp: new Date().toISOString()
          });
        });
      }
    } catch (error) {
      console.error('Error al eliminar amigo:', error);
      socket.emit('error', { message: 'Error al eliminar amigo' });
    }
  });

  // Evento para comentarios en posts
  socket.on('comment_on_post', async ({ postId, userId, comment, postAuthorId }) => {
    try {
      const userDoc = await User.doc(userId).get();
      const userName = userDoc.data().name;
      const userLastName = userDoc.data().lastname;
      
      // Notificar al autor del post si está en línea
      if (userSockets.has(postAuthorId)) {
        const authorSockets = userSockets.get(postAuthorId);
        authorSockets.forEach(socketId => {
          io.to(socketId).emit('post_comment', {
            postId,
            userId,
            userName,
            userLastName,
            comment,
            timestamp: new Date().toISOString()
          });
        });
      }
    } catch (error) {
      console.error('Error al procesar comentario:', error);
      socket.emit('error', { message: 'Error al procesar comentario' });
    }
  });

  // Evento para reacciones en posts
  socket.on('react_to_post', async ({ postId, userId, reaction, postAuthorId }) => {
    try {
      const userDoc = await User.doc(userId).get();
      const userName = userDoc.data().name;
      const userLastName = userDoc.data().lastname;
      
      // Notificar al autor del post si está en línea
      if (userSockets.has(postAuthorId)) {
        const authorSockets = userSockets.get(postAuthorId);
        authorSockets.forEach(socketId => {
          io.to(socketId).emit('post_reaction', {
            postId,
            userId,
            userName,
            userLastName,
            reaction,
            timestamp: new Date().toISOString()
          });
        });
      }
    } catch (error) {
      console.error('Error al procesar reacción:', error);
      socket.emit('error', { message: 'Error al procesar reacción' });
    }
  });

  // Handle post like notification
  socket.on('post_like', async (data) => {
    try {
      const { postId, likedBy, postAuthorId } = data;
      
      if (!postId || !likedBy || !postAuthorId) {
        throw new Error('Missing required fields for post like notification');
      }

      // Save notification to Firestore
      await Messages.add({
        type: 'post_like',
        postId,
        likedBy,
        postAuthorId,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Emit notification to post author if they're online
      const authorSocket = connectedUsers.get(postAuthorId);
      if (authorSocket) {
        io.to(authorSocket.socketId).emit('notification', {
          type: 'post_like',
          postId,
          likedBy,
          createdAt: new Date()
        });
      }
    } catch (error) {
      console.error('Error handling post like:', error);
    }
  });

  // Handle post comment notification
  socket.on('post_comment', async (data) => {
    try {
      const { postId, commentBy, postAuthorId, commentText } = data;
      
      if (!postId || !commentBy || !postAuthorId) {
        throw new Error('Missing required fields for post comment notification');
      }

      // Save notification to Firestore
      await Messages.add({
        type: 'post_comment',
        postId,
        commentBy,
        postAuthorId,
        commentText: commentText || '',
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Emit notification to post author if they're online
      const authorSocket = connectedUsers.get(postAuthorId);
      if (authorSocket) {
        io.to(authorSocket.socketId).emit('notification', {
          type: 'post_comment',
          postId,
          commentBy,
          commentText: commentText || '',
          createdAt: new Date()
        });
      }
    } catch (error) {
      console.error('Error handling post comment:', error);
    }
  });
});

// Rutas de la API
app.use("/users", Users)
app.use("/posts", Posts)
app.use("/photos", Photos)
app.use("/relationships", RelationShips)
app.use("/interactions", Interactions)
app.use("/messages", MessagesR)
app.use("/friendships", Friendships)
app.use('/notifications', notificationsRoutes);

// Manejo de errores
app.use((err, req, res, next) => {
  console.error('Error en la aplicación:', err.message);
  res.status(500).json({
    status: false,
    message: "Error interno del servidor"
  });
});

// Iniciar servidor
const serverListener = server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Error: Port ${PORT} is already in use. Please try these solutions:`);
    console.error('1. Kill the process using the port:');
    console.error(`   lsof -i :${PORT} | grep LISTEN`);
    console.error(`   kill <PID>`);
    console.error('2. Or use a different port by setting the PORT environment variable:');
    console.error('   PORT=3007 npm start');
    process.exit(1);
  } else {
    console.error('Server error:', err);
  }
});

// Manejo de señales para cierre limpio
process.on('SIGTERM', () => {
  console.log('Recibida señal SIGTERM. Cerrando servidor...');
  server.close(() => {
    console.log('Servidor cerrado.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('Recibida señal SIGINT. Cerrando servidor...');
  server.close(() => {
    console.log('Servidor cerrado.');
    process.exit(0);
  });
});