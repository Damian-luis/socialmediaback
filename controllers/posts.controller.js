const {Post,RelationShip,User} = require('../config/db');
let today = new Date();
module.exports={
    getAllPosts:async(req,res)=>{
        
        const {idUser}=req.params

        try {
            const userDocs = await User.get().then((snapshot) => snapshot.docs);
            const usersData = userDocs.map((doc) => {
              return {
                name: doc._fieldsProto.name.stringValue,
                lastname: doc._fieldsProto.lastname.stringValue,
                mail: doc._fieldsProto.mail.stringValue,
                date: doc._fieldsProto.date.stringValue,
                time: doc._fieldsProto.time.stringValue,
                password: doc._fieldsProto.password.stringValue,
                urlProfile: doc._fieldsProto.urlProfile.stringValue,
                id: doc._ref._path.segments[1],
              };
            });
        
            const relationshipDocs = await RelationShip.get();
            const myFriends = relationshipDocs.docs.filter((doc) => doc._fieldsProto.idUser.stringValue === idUser);
        
            const friendData = myFriends.map((doc) => {
              return {
                idUser: doc._fieldsProto.idUser.stringValue,
                idFollowed: doc._fieldsProto.idFollowed.stringValue,
                date: doc._fieldsProto.date.stringValue,
                time: doc._fieldsProto.time.stringValue,
                idFollow: doc._ref._path.segments[1],
              };
            });
        
            const idFriends = friendData.map((friend) => friend.idFollowed);
        
            const postDocs = await Post.get();
            const allPosts = postDocs.docs.map((doc) => {
              return {
                publicacion: doc._fieldsProto.publicacion.stringValue,
                nombre: doc._fieldsProto.name.stringValue,
                apellido: doc._fieldsProto.lastname.stringValue,
                idUser: doc._fieldsProto.idUser.stringValue,
                date: doc._fieldsProto.date.stringValue,
                time: doc._fieldsProto.time.stringValue,
                usersComments: doc._fieldsProto.usersComments.arrayValue.values.map((comment) => {
                  return {
                    name: comment.mapValue.fields.name.stringValue,
                    lastname: comment.mapValue.fields.lastname.stringValue,
                    time: comment.mapValue.fields.time.stringValue,
                    date: comment.mapValue.fields.date.stringValue,
                    comment: comment.mapValue.fields.comment.stringValue,
                    idComment: comment.mapValue.fields.idComment.stringValue,
                    idUser: comment.mapValue.fields.idUser.stringValue,
                    urlProfile: "", // Inicializar la URL del perfil
                  };
                }),
                usersLinked: doc._fieldsProto.usersLinked.arrayValue.values.map((like) => {
                  return {
                    name: like.mapValue.fields.name.stringValue,
                    lastname: like.mapValue.fields.lastname.stringValue,
                    idLike: like.mapValue.fields.idLike.stringValue,
                    idUser: like.mapValue.fields.idUser.stringValue,
                  };
                }),
                idPublicacion: doc._ref._path.segments[1],
              };
            });
        
            const myFriendsPosts = allPosts.filter((post) => idFriends.includes(post.idUser));
        
            for (let i = 0; i < myFriendsPosts.length; i++) {
              for (let j = 0; j < myFriendsPosts[i].usersLinked.length; j++) {
                if (myFriendsPosts[i].usersLinked[j].idUser === idUser) {
                  myFriendsPosts[i].like = true;
                }
              }
        
              myFriendsPosts[i].usersComments.forEach(async (comment) => {
                const commenterId = comment.idUser;
                const commenter = usersData.find((user) => user.id === commenterId);
        
                if (commenter) {
                  // Asignar la URL del perfil al comentario
                  comment.urlProfile = commenter.urlProfile;
                } else {
                  // Si el comentario es de un usuario que no está en usersData, obtener la URL del perfil de la base de datos
                  const commenterDoc = await User.doc(commenterId).get();
                  const commenterData = {
                    name: commenterDoc._fieldsProto.name.stringValue,
                    lastname: commenterDoc._fieldsProto.lastname.stringValue,
                    mail: commenterDoc._fieldsProto.mail.stringValue,
                    date: commenterDoc._fieldsProto.date.stringValue,
                    time: commenterDoc._fieldsProto.time.stringValue,
                    password: commenterDoc._fieldsProto.password.stringValue,
                    urlProfile: commenterDoc._fieldsProto.urlProfile.stringValue,
                    id: commenterDoc._ref._path.segments[1],
                  };
        
                  // Asignar la URL del perfil al comentario
                  comment.urlProfile = commenterData.urlProfile;
                }
              });
        
              // Obtener la URL de perfil del usuario que hizo la publicación
              const authorId = myFriendsPosts[i].idUser;
              const author = usersData.find((user) => user.id === authorId);
        
              if (author) {
                // Asignar la URL del perfil al post
                myFriendsPosts[i].urlProfile = author.urlProfile;
              } else {
                // Si el usuario que hizo la publicación no está en usersData, obtener la URL del perfil de la base de datos
                const authorDoc = await User.doc(authorId).get();
                const authorData = {
                  name: authorDoc._fieldsProto.name.stringValue,
                  lastname: authorDoc._fieldsProto.lastname.stringValue,
                  mail: authorDoc._fieldsProto.mail.stringValue,
                  date: authorDoc._fieldsProto.date.stringValue,
                  time: authorDoc._fieldsProto.time.stringValue,
                  password: authorDoc._fieldsProto.password.stringValue,
                  urlProfile: authorDoc._fieldsProto.urlProfile.stringValue,
                  id: authorDoc._ref._path.segments[1],
                };
        
                // Asignar la URL del perfil al post
                myFriendsPosts[i].urlProfile = authorData.urlProfile;
              }
            }
        
            const myPosts = allPosts.filter((post) => post.idUser === idUser);
        
            res.status(200).json({
              status: true,
              message: "Publicaciones recuperadas exitosamente",
              misPublicaciones: myPosts,
              publicacionesAmigos: myFriendsPosts,
            });
          } catch (error) {
            console.error(error);
            res.status(400).json({
              status: false,
              message: "No se han podido recuperar las publicaciones",
            });
          }
    },
    addPosts: async(req,res) => {
        const {name,lastname,idUser}=req.params
        const {publicacion}=req.body
        console.log(name+lastname+idUser+publicacion)
        

let date = today.toLocaleDateString()
let time = today.toLocaleTimeString() 
        try{
            await Post.add({
                name,
                lastname,
                publicacion,
                idUser,
                date,
                time,
                usersLinked:[],
                usersComments:[]
            })
            res.status(200).json({
                status:true,
                message:"Tu publicación se ha subido exitosamente"
            })
        }
        catch(err){
            res.status(400).json({
                status:false,
                message:"No se ha podido publicar tu estado"
            })
        }
        
    },
    updatePosts: async(req,res) => {
        const {publicacion}=req.body
        const {idUser}=req.params
        const {idPublicacion}=req.params
        const Posts=await Post.get()
        
        try{
            await Post.doc(idPublicacion).update({
                publicacion,
                idUser
            })
            res.status(200).json({
                status:true,
                message:"Su publicación se ha actualizado correctamente"
            })
        }
        catch(e){
            res.status(400).json({
                status:false,
                message:"No se ha podido actualizar tu publicación"
            })
        }
    },
    deletePosts:async (req,res) => {
        const {idUser}=req.params
        const {idPublicacion}=req.params
        console.log("user"+idUser)
        console.log(idPublicacion)
        try{
            await Post.doc(idPublicacion).delete()
            res.status(200).json({
                status:true,
                message:"Su publicación se ha eliminado exitosamente"
            })
        }
        catch(e){
            res.status(400).json({
                status:false,
                message:"No se ha podido eliminar su publicación"
            })
        }
        
    }
}