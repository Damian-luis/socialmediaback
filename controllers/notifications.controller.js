const admin = require('firebase-admin');
const db = admin.firestore();

const notificationsController = {
  // Guardar una nueva notificación
  saveNotification: async (req, res) => {
    try {
      const { userId, type, senderId, postId, comment, timestamp } = req.body;
      
      const notificationRef = db.collection('notifications').doc();
      await notificationRef.set({
        userId,
        type,
        senderId,
        postId,
        comment,
        timestamp: timestamp || admin.firestore.FieldValue.serverTimestamp(),
        read: false
      });

      res.json({ status: true, message: 'Notificación guardada correctamente' });
    } catch (error) {
      console.error('Error al guardar la notificación:', error);
      res.status(500).json({ status: false, error: 'Error al guardar la notificación' });
    }
  },

  // Obtener notificaciones de un usuario
  getUserNotifications: async (req, res) => {
    try {
      const { userId } = req.params;
      
      const notificationsSnapshot = await db.collection('notifications')
        .where('userId', '==', userId)
        .orderBy('timestamp', 'desc')
        .limit(50)
        .get();

      const notifications = [];
      
      for (const doc of notificationsSnapshot.docs) {
        const notification = doc.data();
        let senderInfo = {
          id: notification.senderId,
          name: 'Usuario',
          lastname: 'Desconocido',
          profilePic: null // Valor por defecto para la foto de perfil
        };

        try {
          // Obtener datos del remitente
          const senderDoc = await db.collection('users').doc(notification.senderId).get();
          if (senderDoc.exists) {
            const senderData = senderDoc.data();
            if (senderData) {
              senderInfo = {
                id: notification.senderId,
                name: senderData.name || 'Usuario',
                lastname: senderData.lastname || 'Desconocido',
                profilePic: senderData.profilePic || null
              };
            }
          }
        } catch (senderError) {
          console.error('Error al obtener datos del remitente:', senderError);
          // Continuamos con la información por defecto del remitente
        }
        
        notifications.push({
          id: doc.id,
          ...notification,
          sender: senderInfo
        });
      }

      res.json({ status: true, notifications });
    } catch (error) {
      console.error('Error al obtener las notificaciones:', error);
      res.status(500).json({ status: false, error: 'Error al obtener las notificaciones' });
    }
  },

  // Marcar notificaciones como leídas
  markAsRead: async (req, res) => {
    try {
      const { userId } = req.params;
      const batch = db.batch();
      
      const unreadNotifications = await db.collection('notifications')
        .where('userId', '==', userId)
        .where('read', '==', false)
        .get();

      unreadNotifications.docs.forEach(doc => {
        batch.update(doc.ref, { read: true });
      });

      await batch.commit();
      res.json({ status: true, message: 'Notificaciones marcadas como leídas' });
    } catch (error) {
      console.error('Error al marcar las notificaciones como leídas:', error);
      res.status(500).json({ status: false, error: 'Error al marcar las notificaciones como leídas' });
    }
  }
};

module.exports = notificationsController; 