const {RelationShip} = require('../config/db');
const {User} = require('../config/db');
let today = new Date();
module.exports={
    allFollows: async (req, res) => {
        const { idUser } = req.params;
        const { idFollowed } = req.params;
    
        try {
            const userData = await User.get().then((snapshot) => snapshot.docs.map((doc) => ({
                name: doc._fieldsProto.name.stringValue,
                lastname: doc._fieldsProto.lastname.stringValue,
                mail: doc._fieldsProto.mail.stringValue,
                id: doc._ref._path.segments[1],
                urlProfile: doc._fieldsProto.urlProfile.stringValue, // Agregamos la URL del perfil
                liveCountry: doc._fieldsProto.liveCountry.stringValue, // Agregamos la propiedad liveCountry
                createdAt: doc._fieldsProto.createdAt.timestampValue, // Agregamos la propiedad createdAt
            })));
    
            const relationshipData = await RelationShip.get();
            const relationships = relationshipData.docs.map((doc) => ({
                idUser: doc._fieldsProto.idUser.stringValue,
                idFollowed: doc._fieldsProto.idFollowed.stringValue,
                name: doc._fieldsProto.name.stringValue,
                lastname: doc._fieldsProto.lastname.stringValue,
                mail: doc._fieldsProto.mail.stringValue,
                date: doc._fieldsProto.date.stringValue,
                time: doc._fieldsProto.time.stringValue,
                idFollow: doc._ref._path.segments[1],
            }));
    
            const friends = relationships.filter((relationship) => relationship.idUser === idUser);
            const noFriends = userData.filter((user) => user.id !== idUser);
    
            // Obtener la URL del perfil, liveCountry y createdAt para los amigos
            for (let i = 0; i < friends.length; i++) {
                const friendId = friends[i].idFollowed;
                const friend = userData.find((user) => user.id === friendId);
    
                if (friend) {
                    // Asignar la URL del perfil, liveCountry y createdAt al amigo
                    friends[i].urlProfile = friend.urlProfile;
                    friends[i].liveCountry = friend.liveCountry;
                    friends[i].createdAt = friend.createdAt;
                } else {
                    // Si el amigo no está en userData, obtener la URL del perfil, liveCountry y createdAt de la base de datos
                    const friendDoc = await User.doc(friendId).get();
                    const friendData = {
                        name: friendDoc._fieldsProto.name.stringValue,
                        lastname: friendDoc._fieldsProto.lastname.stringValue,
                        mail: friendDoc._fieldsProto.mail.stringValue,
                        urlProfile: friendDoc._fieldsProto.urlProfile.stringValue,
                        liveCountry: friendDoc._fieldsProto.liveCountry.stringValue,
                        createdAt: friendDoc._fieldsProto.createdAt.timestampValue,
                        id: friendDoc._ref._path.segments[1],
                    };
    
                    // Asignar la URL del perfil, liveCountry y createdAt al amigo
                    friends[i].urlProfile = friendData.urlProfile;
                    friends[i].liveCountry = friendData.liveCountry;
                    friends[i].createdAt = friendData.createdAt;
                }
            }
    
            res.status(200).json({
                status: true,
                message: "Seguidores conseguidos exitosamente",
                friends,
                noFriends,
            });
        } catch (error) {
            console.error(error);
            res.status(400).json({
                status: false,
                message: "No se han podido recuperar los seguidores",
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
        const {idUser}=req.params
        const {idFollowed}=req.params
        const {idFollow}=req.params
        try{
            await RelationShip.doc(idFollow).delete()
            res.status(400).json({
                status:false,
                message:"Has dejado de seguir a este usuario"
            })
        }
        catch(e){
            res.status(400).json({
                status:false,
                message:"No se puede dejar de seguir a este usuario"
            })
        }
        
    }
}