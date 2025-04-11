const { db } = require('../config/db');
const { verifyToken } = require('../jwt/verifyToken');

const friendshipsController = {
  // Obtener el estado de la relación entre dos usuarios
  getFriendshipStatus: async (req, res) => {
    try {
      const { userId1, userId2 } = req.params;
      
      const friendship = await db.collection('friendships')
        .where('users', 'array-contains', userId1)
        .where('users', 'array-contains', userId2)
        .limit(1)
        .get();

      if (friendship.empty) {
        return res.json({ status: null });
      }

      const friendshipData = friendship.docs[0].data();
      return res.json({ 
        status: friendshipData.status,
        requestId: friendshipData.id
      });
    } catch (error) {
      console.error('Error getting friendship status:', error);
      res.status(500).json({ error: 'Error al obtener el estado de la amistad' });
    }
  },

  // Enviar solicitud de amistad
  sendFriendRequest: async (req, res) => {
    try {
      const { senderId, receiverId } = req.body;

      // Verificar si ya existe una relación
      const existingFriendship = await db.collection('friendships')
        .where('users', 'array-contains', senderId)
        .where('users', 'array-contains', receiverId)
        .limit(1)
        .get();

      if (!existingFriendship.empty) {
        return res.status(400).json({ error: 'Ya existe una relación entre estos usuarios' });
      }

      // Crear nueva solicitud de amistad
      const friendshipRef = await db.collection('friendships').add({
        users: [senderId, receiverId],
        status: 'pending',
        senderId,
        receiverId,
        timestamp: new Date()
      });

      res.json({ 
        status: true,
        friendshipId: friendshipRef.id
      });
    } catch (error) {
      console.error('Error sending friend request:', error);
      res.status(500).json({ error: 'Error al enviar la solicitud de amistad' });
    }
  },

  // Aceptar solicitud de amistad
  acceptFriendRequest: async (req, res) => {
    try {
      const { requestId, receiverId } = req.body;

      const friendshipRef = db.collection('friendships').doc(requestId);
      const friendship = await friendshipRef.get();

      if (!friendship.exists) {
        return res.status(404).json({ error: 'Solicitud de amistad no encontrada' });
      }

      const friendshipData = friendship.data();
      if (friendshipData.receiverId !== receiverId) {
        return res.status(403).json({ error: 'No autorizado para aceptar esta solicitud' });
      }

      await friendshipRef.update({
        status: 'accepted',
        acceptedAt: new Date()
      });

      res.json({ status: true });
    } catch (error) {
      console.error('Error accepting friend request:', error);
      res.status(500).json({ error: 'Error al aceptar la solicitud de amistad' });
    }
  },

  // Rechazar solicitud de amistad
  rejectFriendRequest: async (req, res) => {
    try {
      const { requestId, receiverId } = req.body;

      const friendshipRef = db.collection('friendships').doc(requestId);
      const friendship = await friendshipRef.get();

      if (!friendship.exists) {
        return res.status(404).json({ error: 'Solicitud de amistad no encontrada' });
      }

      const friendshipData = friendship.data();
      if (friendshipData.receiverId !== receiverId) {
        return res.status(403).json({ error: 'No autorizado para rechazar esta solicitud' });
      }

      await friendshipRef.delete();

      res.json({ status: true });
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      res.status(500).json({ error: 'Error al rechazar la solicitud de amistad' });
    }
  },

  // Eliminar amigo
  removeFriend: async (req, res) => {
    try {
      const { userId1, userId2 } = req.params;

      const friendship = await db.collection('friendships')
        .where('users', 'array-contains', userId1)
        .where('users', 'array-contains', userId2)
        .where('status', '==', 'accepted')
        .limit(1)
        .get();

      if (friendship.empty) {
        return res.status(404).json({ error: 'No se encontró la relación de amistad' });
      }

      await friendship.docs[0].ref.delete();

      res.json({ status: true });
    } catch (error) {
      console.error('Error removing friend:', error);
      res.status(500).json({ error: 'Error al eliminar amigo' });
    }
  }
};

module.exports = friendshipsController; 