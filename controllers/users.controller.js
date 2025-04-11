var jwt = require('jsonwebtoken');
const {User,Post} = require('../config/db');
const bcrypt = require('bcrypt');
const { uploadImage } = require('../config/cloudinary');
const admin = require('firebase-admin');
const saltRounds = 10;
let today = new Date();
const RelationShip = require('../config/db').RelationShip;

module.exports={
    getAll:async(req, res) =>{
      const data=await User.get()
      const response=await data.docs.map(e=>{return {
         name:e._fieldsProto.name.stringValue,
         lastname:e._fieldsProto.lastname.stringValue,
         mail:e._fieldsProto.mail.stringValue,
         id:e._ref._path.segments[1]
      }})
      res.status(200).json({
         status:true,
         message:"Usuarios enviados con exito"
      })
    },
    getUser: async (req, res) => {
      const { id } = req.params;
  
      try {
          // Datos básicos del usuario
          const userData = await User.doc(id).get();
          const userDataObj = {
              name: userData._fieldsProto.name.stringValue,
              lastname: userData._fieldsProto.lastname.stringValue,
              mail: userData._fieldsProto.mail.stringValue,
              date: userData._fieldsProto.date.stringValue,
              time: userData._fieldsProto.time.stringValue,
              country: userData._fieldsProto.country?.stringValue || '',
              liveCountry: userData._fieldsProto.liveCountry?.stringValue || '',
              birthday: userData._fieldsProto.birthday?.stringValue || '',
              ocupation: userData._fieldsProto.ocupation?.stringValue || '',
              urlProfile: userData._fieldsProto.urlProfile.stringValue,
              id: userData._ref._path.segments[1],
          };
  
  
          // Obtener todas las publicaciones
          const postsData = await Post.get();
          const allPosts = postsData.docs.map((doc) => ({
              publicacion: doc._fieldsProto.publicacion.stringValue,
              nombre: doc._fieldsProto.name.stringValue,
              apellido: doc._fieldsProto.lastname.stringValue,
              idUser: doc._fieldsProto.idUser.stringValue,
              date: doc._fieldsProto.date.stringValue,
              time: doc._fieldsProto.time.stringValue,
              type: doc._fieldsProto.type?.stringValue || 'text',
              photos: doc._fieldsProto.photos?.arrayValue?.values?.map(photo => photo.stringValue) || [],
              idPublicacion: doc._ref._path.segments[1],
              usersComments: doc._fieldsProto.usersComments.arrayValue.values.map((comment) => ({
                  name: comment.mapValue.fields.name.stringValue,
                  lastname: comment.mapValue.fields.lastname.stringValue,
                  time: comment.mapValue.fields.time.stringValue,
                  date: comment.mapValue.fields.date.stringValue,
                  comment: comment.mapValue.fields.comment.stringValue,
                  idComment: comment.mapValue.fields.idComment.stringValue,
                  idUser: comment.mapValue.fields.idUser.stringValue,
                  urlProfile: "",
              })),
              usersLinked: doc._fieldsProto.usersLinked?.arrayValue?.values?.map(user => ({
                  idUser: user.mapValue.fields.idUser.stringValue,
              })) || [],
              timestamp: new Date(`${doc._fieldsProto.date.stringValue} ${doc._fieldsProto.time.stringValue}`).getTime()
          }));
  
          // Obtener SOLO los posts del usuario (nueva propiedad)
          const userPostsOnly = allPosts.filter(post => post.idUser === id)
              .sort((a, b) => b.timestamp - a.timestamp);
  
          // Obtener los posts del usuario y sus amigos (como estaba originalmente)
          const userAndFriendsPosts = allPosts.filter(post => {
              // Incluir posts propios
              if (post.idUser === id) return true;
              
              // Incluir posts de amigos
              return post.idUser !== id;
          }).sort((a, b) => b.timestamp - a.timestamp);
  
          // Agregar URLs de perfil a los comentarios (para ambos conjuntos de posts)
          const addProfileUrls = async (posts) => {
              for (let post of posts) {
                  for (let comment of post.usersComments) {
                      const commenterId = comment.idUser;
                      const commenterData = await User.doc(commenterId).get();
                      comment.urlProfile = commenterData._fieldsProto.urlProfile.stringValue;
                  }
              }
          };
  
          await addProfileUrls(userPostsOnly);
          await addProfileUrls(userAndFriendsPosts);
  
  
          res.status(200).json({
              status: true,
              message: "Informacion recuperada exitosamente",
              user: [userDataObj],
              post: userAndFriendsPosts,  // Posts del usuario y amigos (como antes)
              userPostsOnly: userPostsOnly,  // Nueva propiedad con solo posts del usuario
          });
      } catch (error) {
          console.error(error);
          res.status(400).json({
              status: false,
              message: "No se ha podido acceder al perfil",
          });
      }
  },
  
  
  
  
  
  
    getLogin:async (req, res) =>{
      const {mail,password}=req.body
      const data=await User.get() 
      const response=await data.docs.map(e=>{return {
         name:e._fieldsProto.name.stringValue,
         lastname:e._fieldsProto.lastname.stringValue,
         mail:e._fieldsProto.mail.stringValue,
         date:e._fieldsProto.date.stringValue,
         time:e._fieldsProto.time.stringValue, 
         password:e._fieldsProto.password.stringValue,
         urlProfile:e._fieldsProto.urlProfile.stringValue,
         id:e._ref._path.segments[1] 
      }})
      const userExist=response.some(user=>user.mail===mail)
      if(!userExist) return res.status(400).json({
         status:false,
         message:"No existe un usuario registrado con ese correo electrónico"
      })
      const user=response.filter(e=>{return e.mail===mail})
      
      bcrypt.compare(password, user[0].password, function(err, result) {
         if(result){
            // Comentamos la generación del token JWT
            // try{
            //    const token = jwt.sign({ id: user[0].id }, process.env.SECRET_KEY, { expiresIn: '24h' });
            //    res.status(200).send({
            //       status:true,
            //       user,
            //       token
            //    })
            // }
            // catch(error){
            //    res.status(400).json({
            //       status:false,
            //       message:"Error al generar el token de autenticación"
            //    })
            // }
            
            // Enviamos la respuesta sin token
            res.status(200).send({
               status:true,
               user
            })
         }
         else{
            res.status(400).json({
               status:false,
               message:"Usuario o contraseña incorrectos"
            })
         }
      })
    },
    getUserData: async (req, res) => {
        const { id } = req.params;
        
        try {
            const userDoc = await User.doc(id).get();
            if (!userDoc.exists) {
                return res.status(404).json({ error: 'Usuario no encontrado' });
            }

            const userData = userDoc.data();
            
            // Obtener estado de amistad si hay un usuario autenticado
            let friendshipStatus = null;
            if (req.user && req.user.id !== id) {
                const friendship = await RelationShip
                    .where('senderId', 'in', [req.user.id, id])
                    .where('receiverId', 'in', [req.user.id, id])
                    .limit(1)
                    .get();

                if (!friendship.empty) {
                    const friendshipData = friendship.docs[0].data();
                    friendshipStatus = {
                        status: friendshipData.status,
                        requestId: friendship.docs[0].id,
                        isSender: friendshipData.senderId === req.user.id
                    };
                }
            }

            res.json({
                ...userData,
                id: userDoc.id,
                friendshipStatus
            });
        } catch (error) {
            console.error('Error getting user data:', error);
            res.status(500).json({ error: 'Error al obtener los datos del usuario' });
        }
    },
  
    getLogout:(req, res) =>{
        const authHeader = req.headers["authorization"];
   jwt.sign(authHeader, "", { expiresIn: '1s' } , (logout, err) => {
      if (logout) {
         res.send({msg : 'Has sido desconectado' });
      } else {
         res.send({msg:'Error'});
      }
   });
    },
    addUser: async (req, res) => {
      const { name, lastname, mail, password, country, liveCountry, birthday, ocupation } = req.body;
      const data = await User.get();
      const response = await data.docs.map((e) => {
          return {
              name: e._fieldsProto.name.stringValue,
              lastname: e._fieldsProto.lastname.stringValue,
              mail: e._fieldsProto.mail.stringValue,
              id: e._ref._path.segments[1],
          };
      });
      const today = new Date();
      let date = today.toLocaleDateString();
      let time = today.toLocaleTimeString();
      
      const userExist = response.some((user) => user.mail === mail);
      
      if (userExist) {
          return res.status(400).json({
              status: false,
              message: "Ya existe un usuario registrado con ese correo electrónico",
          });
      }
  
      try {
          bcrypt.hash(password, saltRounds, async (err, hash) => {
              if (err) {
                  return res.status(500).json({
                      status: false,
                      message: "Error al crear el usuario",
                  });
              }
  
              const newUser = {
                  name,
                  lastname,
                  mail,
                  password: hash,
                  date,
                  time,
                  country,
                  liveCountry,
                  birthday,
                  ocupation,
                  urlProfile: "",
                  createdAt: admin.firestore.FieldValue.serverTimestamp(),
              };
  
              await User.add(newUser);
  
              res.status(200).json({
                  status: true,
                  message: "Usuario creado con éxito",
              });
          });
      } catch (error) {
          res.status(400).json({
              status: false,
              message: error,
          });
      }
  },




    test:async(req,res) =>{
const id=req.params.id
//const user=User.doc(id).update({sexo:admin.firestore.FieldValue.delete()})

//await User.doc(id).update({name:"hola"})

   const data=await User.get()
const response=await data.docs.map(e=>{return {
   name:e._fieldsProto.name.stringValue,
   lastname:e._fieldsProto.lastname.stringValue,
   mail:e._fieldsProto.mail.stringValue,
   date:e._fieldsProto.date.stringValue,
   time:e._fieldsProto.time.stringValue,
   id:e._ref._path.segments[1]
    }})
   


let dataBasica=response.filter(e=>{return e.id===id})
dataBasica[0].mail=[dataBasica[0].mail,"newmail@gmial.com"]

//TESTEANDO ELIMINAR REACCION
await User.doc(id).update({name:"holssa"})
res.send(dataBasica)

    },
updateUserData:async(req,res) => {
   const id=req.params.id
   const edit=req.body
   console.log(edit)
   try{
      const data=await User.get()
const response=await data.docs.map(e=>{return {
   name:e._fieldsProto.name.stringValue,
   lastname:e._fieldsProto.lastname.stringValue,
   mail:e._fieldsProto.mail.stringValue,
   date:e._fieldsProto.date.stringValue,
   time:e._fieldsProto.time.stringValue,
   id:e._ref._path.segments[1]
    }})
   


let dataBasica=response.filter(e=>{return e.id===id})
//dataBasica[0].mail=[dataBasica[0].mail,"newmail@gmial.com"]


await User.doc(id).update(edit)
res.status(200).json({
   status:true,
   message:"Su informacion se ha actualizado correctamente"
})
   }
   catch(e){
      res.status(404).json({
         status:false,
         message:"No se ha podido actualizar la informacion de su perfil"
      })
   }
},

uploadProfilePicture: async (req, res) => {
    const id = req.params.id;
    
    try {
      console.log('Iniciando actualización de foto de perfil para usuario:', id);
      console.log('Request files:', req.files);
      console.log('Request body:', req.body);
      console.log('Request headers:', req.headers);

      // Buscar el archivo en cualquiera de los campos (archivo o photo)
      const uploadedFile = req.files && (req.files.archivo || req.files.photo);
      if (!uploadedFile) {
        console.log('No se proporcionó ningún archivo');
        return res.status(400).json({
          status: false,
          message: "No se ha proporcionado ningún archivo"
        });
      }
  
      // Validar tipo de archivo
      const file = uploadedFile;
      console.log('Detalles del archivo:', {
        name: file.name,
        size: file.size,
        mimetype: file.mimetype,
        hasData: !!file.data
      });

      if (!file.mimetype.startsWith('image/')) {
        console.log('Tipo de archivo no válido:', file.mimetype);
        return res.status(400).json({
          status: false,
          message: "Solo se permiten archivos de imagen"
        });
      }
  
      // Validar tamaño (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        console.log('Archivo demasiado grande:', file.size);
        return res.status(400).json({
          status: false,
          message: "La imagen no debe exceder 5MB"
        });
      }
  
      console.log('Subiendo imagen a ImgBB...');
      const url = await uploadImage(file);
      console.log('Imagen subida exitosamente, URL:', url);
  
      console.log('Actualizando URL en Firebase...');
      await User.doc(id).update({ 
        urlProfile: url,
        lastProfileUpdate: admin.firestore.FieldValue.serverTimestamp() 
      });
      console.log('URL actualizada en Firebase');
  
      res.status(200).json({
        status: true,
        message: "Foto de perfil actualizada exitosamente",
        url: url
      });
    } catch (error) {
      console.error('Error al actualizar la foto de perfil:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({
        status: false,
        message: error.message || "Error al actualizar la foto de perfil"
      });
    }
  },

updateProfilePhoto: async (req, res) => {
  try {
    // Redirigir al método uploadProfilePicture para unificar la lógica
    return await module.exports.uploadProfilePicture(req, res);
  } catch (error) {
    console.error('Error al actualizar la foto de perfil:', error);
    res.status(500).json({
      status: false,
      message: "Error al actualizar la foto de perfil",
      error: error.message
    });
  }
},

}
//User.add({data}),User.get() data.docs,User.doc(id).update() the same with delete()