const {RelationShip} = require('../config/db');
const {User} = require('../config/db');
let today = new Date();
module.exports={
    allFollows: async (req, res) => {
        const { idUser } = req.params;
        try {
            // Obtener todos los usuarios
            const userData = await User.get().then((snapshot) => snapshot.docs.map((doc) => {
                const data = doc.data();
                return {
                    name: data.name,
                    lastname: data.lastname,
                    mail: data.mail,
                    id: doc.id,
                    urlProfile: data.urlProfile,
                    liveCountry: data.liveCountry,
                    createdAt: data.createdAt
                };
            }));

            // Obtener relaciones de amistad
            const friendships = await RelationShip
                .where('senderId', '==', idUser)
                .where('status', '==', 'accepted')
                .get();

            // Obtener seguidores
            const follows = await RelationShip
                .where('idUser', '==', idUser)
                .get();

            const friends = friendships.docs.map(doc => {
                const data = doc.data();
                const friend = userData.find(user => user.id === data.receiverId);
                return {
                    ...friend,
                    idFollow: doc.id,
                    date: data.timestamp,
                    time: data.timestamp,
                    status: 'friend'
                };
            });

            const followers = follows.docs.map(doc => {
                const data = doc.data();
                const follower = userData.find(user => user.id === data.idFollowed);
                return {
                    ...follower,
                    idFollow: doc.id,
                    date: data.date,
                    time: data.time,
                    status: 'follower'
                };
            });

            // Combinar amigos y seguidores
            const allRelationships = [...friends, ...followers];

            // Obtener usuarios que no son amigos ni seguidores
            const noRelations = userData.filter(user => 
                user.id !== idUser && 
                !allRelationships.some(rel => rel.id === user.id)
            );
//console.log(allRelationships)
            res.status(200).json({
                status: true,
                message: "Relaciones obtenidas exitosamente",
                relationships: allRelationships,
                noRelations,
            });
        } catch (error) {
            console.error(error);
            res.status(400).json({
                status: false,
                message: "No se han podido recuperar las relaciones",
            });
        }
    },
    
    addFollow: async(req,res) => {
        const {idUser,idFollowed,name,lastname,mail}=req.params
        let date = today.toLocaleDateString()
let time = today.toLocaleTimeString() 
        try{
            await RelationShip.add({
                idUser,
                idFollowed,
                name,
                lastname,
                mail,
                date,
                time
            })
            res.status(200).json({
                status:true,
                message:"Has comenzado a seguir a este usuario"
            })
        }
        catch(err){
            res.status(400).json({
                status:false,
                message:"No se ha podido seguir a este usuario"
            })
        }
    },

    deleteFollow:async (req,res) => {
        const {idFollow}=req.params
        try{
            await RelationShip.doc(idFollow).delete()
            res.status(200).json({
                status:true,
                message:"Has dejado de seguir a este usuario"
            })
        }
        catch(e){
            res.status(400).json({
                status:false,
                message:"No se puede dejar de seguir a este usuario"
            })
        }
    },

    // Obtener estado de la relación entre dos usuarios
    getFriendshipStatus: async (req, res) => {
        const { userId1, userId2 } = req.params;
        try {
            const friendship = await RelationShip
                .where('senderId', 'in', [userId1, userId2])
                .where('receiverId', 'in', [userId1, userId2])
                .limit(1)
                .get();

            if (friendship.empty) {
                return res.json({ status: false });
            }

            const friendshipData = friendship.docs[0].data();
            return res.json({ 
                status: true,
                friendshipStatus: friendshipData.status,
                requestId: friendship.docs[0].id,
                senderId: friendshipData.senderId
            });
        } catch (error) {
            console.error('Error getting friendship status:', error);
            res.status(500).json({ error: 'Error al obtener el estado de la amistad' });
        }
    },

    // Enviar solicitud de amistad
    sendFriendRequest: async (req, res) => {
        const { senderId, receiverId } = req.body;
        try {
            // Verificar si ya existe una relación
            const existingFriendship = await RelationShip
                .where('senderId', 'in', [senderId, receiverId])
                .where('receiverId', 'in', [senderId, receiverId])
                .limit(1)
                .get();

            if (!existingFriendship.empty) {
                return res.status(400).json({ 
                    status: false,
                    message: 'Ya existe una relación entre estos usuarios' 
                });
            }

            // Obtener datos del remitente
            const senderDoc = await User.doc(senderId).get();
            const senderData = senderDoc.data();

            // Crear nueva solicitud de amistad
            const friendshipRef = await RelationShip.add({
                senderId,
                receiverId,
                senderName: senderData.name,
                senderLastname: senderData.lastname,
                senderProfile: senderData.urlProfile,
                status: 'pending',
                timestamp: new Date(),
                lastInteraction: new Date(),
                mutualFriends: 0,
                commonInterests: [],
                friendshipStrength: 0
            });

            // Emitir evento de socket
            const io = req.app.get('io');
            if (io) {
                io.emit('friend_request_received', {
                    friendshipId: friendshipRef.id,
                    senderId,
                    receiverId,
                    sender: {
                        id: senderId,
                        name: senderData.name,
                        lastname: senderData.lastname,
                        urlProfile: senderData.urlProfile
                    }
                });
            }

            res.status(200).json({ 
                status: true,
                message: 'Solicitud de amistad enviada',
                friendshipId: friendshipRef.id,
                sender: {
                    id: senderId,
                    name: senderData.name,
                    lastname: senderData.lastname,
                    urlProfile: senderData.urlProfile
                }
            });
        } catch (error) {
            console.error('Error sending friend request:', error);
            res.status(500).json({ 
                status: false,
                message: 'Error al enviar la solicitud de amistad' 
            });
        }
    },

    // Aceptar solicitud de amistad
    acceptFriendRequest: async (req, res) => {
        const { requestId, receiverId } = req.body;
        try {
            const friendshipRef = RelationShip.doc(requestId);
            const friendship = await friendshipRef.get();

            if (!friendship.exists) {
                return res.status(404).json({
                    status: false,
                    message: 'Solicitud de amistad no encontrada'
                });
            }

            const friendshipData = friendship.data();
            if (friendshipData.receiverId !== receiverId) {
                return res.status(403).json({
                    status: false,
                    message: 'No tienes permiso para aceptar esta solicitud'
                });
            }

            // Obtener datos del receptor
            const receiverDoc = await User.doc(receiverId).get();
            const receiverData = receiverDoc.data();

            // Calcular amigos en común
            const senderFriends = await RelationShip
                .where('senderId', '==', friendshipData.senderId)
                .where('status', '==', 'accepted')
                .get();

            const receiverFriends = await RelationShip
                .where('senderId', '==', receiverId)
                .where('status', '==', 'accepted')
                .get();

            const mutualFriends = senderFriends.docs.filter(senderFriend => 
                receiverFriends.docs.some(receiverFriend => 
                    receiverFriend.data().receiverId === senderFriend.data().receiverId
                )
            ).length;

            // Actualizar la solicitud original
            await friendshipRef.update({
                status: 'accepted',
                acceptedAt: new Date(),
                lastInteraction: new Date(),
                mutualFriends
            });

            // Crear la relación inversa
            await RelationShip.add({
                senderId: receiverId,
                receiverId: friendshipData.senderId,
                senderName: receiverData.name,
                senderLastname: receiverData.lastname,
                senderProfile: receiverData.urlProfile,
                status: 'accepted',
                timestamp: friendshipData.timestamp,
                acceptedAt: new Date(),
                lastInteraction: new Date(),
                mutualFriends,
                commonInterests: [],
                friendshipStrength: 0
            });

            res.status(200).json({
                status: true,
                message: 'Solicitud de amistad aceptada',
                mutualFriends
            });
        } catch (error) {
            console.error('Error accepting friend request:', error);
            res.status(500).json({
                status: false,
                message: 'Error al aceptar la solicitud de amistad'
            });
        }
    },

    // Rechazar solicitud de amistad
    rejectFriendRequest: async (req, res) => {
        const { requestId, receiverId } = req.body;
        try {
            const friendshipRef = RelationShip.doc(requestId);
            const friendship = await friendshipRef.get();

            if (!friendship.exists) {
                return res.status(404).json({
                    status: false,
                    message: 'Solicitud de amistad no encontrada'
                });
            }

            const friendshipData = friendship.data();
            if (friendshipData.receiverId !== receiverId) {
                return res.status(403).json({
                    status: false,
                    message: 'No tienes permiso para rechazar esta solicitud'
                });
            }

            await friendshipRef.delete();

            res.status(200).json({
                status: true,
                message: 'Solicitud de amistad rechazada'
            });
        } catch (error) {
            console.error('Error rejecting friend request:', error);
            res.status(500).json({
                status: false,
                message: 'Error al rechazar la solicitud de amistad'
            });
        }
    },

    // Eliminar amigo
    removeFriend: async (req, res) => {
        const { userId1, userId2 } = req.params;
        try {
            const friendship = await RelationShip
                .where('senderId', 'in', [userId1, userId2])
                .where('receiverId', 'in', [userId1, userId2])
                .where('status', '==', 'accepted')
                .limit(1)
                .get();

            if (friendship.empty) {
                return res.status(404).json({
                    status: false,
                    message: 'No se encontró la amistad'
                });
            }

            await friendship.docs[0].ref.delete();

            res.status(200).json({
                status: true,
                message: 'Amigo eliminado correctamente'
            });
        } catch (error) {
            console.error('Error removing friend:', error);
            res.status(500).json({
                status: false,
                message: 'Error al eliminar amigo'
            });
        }
    }
};