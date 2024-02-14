var jwt = require('jsonwebtoken');
const {User,Post} = require('../config/db');
const bcrypt = require('bcrypt');
const {SECRET_KEY,NAME_BUCKET,REGION,ACCESS_KEY_ID,SECRET_ACESS_KEY_ID}= require('../config/s3')

const deleteField= require ("firebase/firestore");
const admin = require('firebase-admin');
const saltRounds = 10;
let today = new Date();
const AWS=require('aws-sdk')
const s3=new AWS.S3({
  region:REGION,
  accessKeyId:ACCESS_KEY_ID,
  secretAccessKey:SECRET_ACESS_KEY_ID
})
const fs=require('fs')
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
  console.log("llega al controlador ")
      try {
          // Datos básicos del usuario
          const userData = await User.doc(id).get();
          const userDataObj = {
              name: userData._fieldsProto.name.stringValue,
              lastname: userData._fieldsProto.lastname.stringValue,
              mail: userData._fieldsProto.mail.stringValue,
              date: userData._fieldsProto.date.stringValue,
              time: userData._fieldsProto.time.stringValue,
              urlProfile: userData._fieldsProto.urlProfile.stringValue,
              id: userData._ref._path.segments[1],
          };
  
          console.log("Datos básicos del usuario:", userDataObj);
  
          // Obtener publicaciones del usuario
          const postsData = await Post.get();
          const userPosts = postsData.docs.map((doc) => ({
              publicacion: doc._fieldsProto.publicacion.stringValue,
              nombre: doc._fieldsProto.name.stringValue,
              apellido: doc._fieldsProto.lastname.stringValue,
              idUser: doc._fieldsProto.idUser.stringValue,
              date: doc._fieldsProto.date.stringValue,
              time: doc._fieldsProto.time.stringValue,
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
          }));
  
          console.log("Publicaciones del usuario:", userPosts);
  
          
          for (let i = 0; i < userPosts.length; i++) {
              for (let j = 0; j < userPosts[i].usersComments.length; j++) {
                  const commenterId = userPosts[i].usersComments[j].idUser;
                  const commenterData = await User.doc(commenterId).get();
                  userPosts[i].usersComments[j].urlProfile = commenterData._fieldsProto.urlProfile.stringValue;
              }
          }
  
          console.log("Publicaciones con URL de perfil:", userPosts);
  
          res.status(200).json({
              status: true,
              message: "Informacion recuperada exitosamente",
              user: [userDataObj],
              post: userPosts,
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
            try{
              // var token = jwt.sign({ id:user.id }, process.env.SECRET_KEY,{expiresIn: '30s'});
               res.status(200).send({
                  status:true,
                  user,
                  //tokenp
                  
               })
            }
            catch(error){
               res.status(400).json({
                  status:false,
                  message:error,
                  bueno:result,
                  malo:err
               })
            }
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
          // Obtener datos básicos del usuario
          const userData = await User.get();
          const response = userData.docs.map(e => ({
              name: e._fieldsProto.name.stringValue,
              lastname: e._fieldsProto.lastname.stringValue,
              mail: e._fieldsProto.mail.stringValue,
              date: e._fieldsProto.date.stringValue,
              time: e._fieldsProto.time.stringValue,
              country: e._fieldsProto.country.stringValue,
              liveCountry: e._fieldsProto.liveCountry.stringValue,
              ocupation: e._fieldsProto.ocupation.stringValue,
              birthday: e._fieldsProto.birthday.stringValue,
              urlProfile: e._fieldsProto.urlProfile.stringValue,
              id: e._ref._path.segments[1],
          }));
  
          const userDataBasica = response.filter(e => e.id === id);
  
          // Obtener publicaciones del usuario seleccionado
          const postsData = await Post.get();
          const publicaciones = postsData.docs.map(e => ({
              publicacion: e._fieldsProto.publicacion.stringValue,
              nombre: e._fieldsProto.name.stringValue,
              apellido: e._fieldsProto.lastname.stringValue,
              idUser: e._fieldsProto.idUser.stringValue,
              date: e._fieldsProto.date.stringValue,
              time: e._fieldsProto.time.stringValue,
              usersComments: e._fieldsProto.usersComments.arrayValue.values.map(comment => {
                  const commentData = comment.mapValue.fields;
                  const commentUser = response.find(user => user.id === commentData.idUser.stringValue);
                  return {
                      name: commentUser.name,
                      lastname: commentUser.lastname,
                      time: commentData.time.stringValue,
                      date: commentData.date.stringValue,
                      comment: commentData.comment.stringValue,
                      idComment: commentData.idComment.stringValue,
                      idUser: commentData.idUser.stringValue,
                      urlProfile: commentUser.urlProfile, // Agregar la URL del perfil
                  };
              }),
              usersLinked: e._fieldsProto.usersLinked.arrayValue.values.map(linkedUser => {
                  const linkedUserData = linkedUser.mapValue.fields;
                  const linkedUserDetail = response.find(user => user.id === linkedUserData.idUser.stringValue);
                  return {
                      name: linkedUserDetail.name,
                      lastname: linkedUserDetail.lastname,
                      idLike: linkedUserData.idLike.stringValue,
                      idUser: linkedUserData.idUser.stringValue,
                      urlProfile: linkedUserDetail.urlProfile, // Agregar la URL del perfil
                  };
              }),
              idPublicacion: e._ref._path.segments[1],
          }));
  
          const misPublicaciones = publicaciones.filter(e => e.idUser === id);
  
          res.status(200).json({
              status: true,
              message: "Informacion recuperada exitosamente",
              user: userDataBasica,
              post: misPublicaciones,
          });
      } catch (error) {
          console.log(error);
          res.status(400).json({
              status: false,
              message: "No se ha podido recuperar la informacion del usuario",
          });
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

uploadProfilePicture:async(req,res) =>{
   const id=req.params.id
   const stream=fs.createReadStream(req.files.archivo.tempFilePath)
   console.log(req.files)
   console.log("llegaste")
   try {
     await s3.putObject({
       Bucket:NAME_BUCKET,
       Key:req.files.archivo.name,
       Body:stream
     },(erro,data)=>{
       if(erro){
         console.log(erro)
       }
       else{
         console.log(data.Location)
       }
       
     }) 
      
     s3.getSignedUrl('getObject',{Bucket:NAME_BUCKET,
       Key:req.files.archivo.name,Expires: 604800},(err, url)=>{
         if (err) {
           console.log('Error generating URL:', err);
         } else {
           //actualizar user
           User.doc(id).update({urlProfile:url}).then((e) => {console.log("funciona")})
           
         }
       })
   } catch (error) { 
     console.log(error) 
     // error handling.
   }  
   res.send("wokring") 
 }
 

}
//User.add({data}),User.get() data.docs,User.doc(id).update() the same with delete()