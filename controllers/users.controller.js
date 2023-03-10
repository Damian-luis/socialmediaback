var jwt = require('jsonwebtoken');
const {User,Post} = require('../config/db');
const bcrypt = require('bcrypt');

const deleteField= require ("firebase/firestore");
const admin = require('firebase-admin');
const saltRounds = 10;
let today = new Date();
const AWS=require('aws-sdk')
const s3=new AWS.S3({
  region:"us-east-2",
  accessKeyId:"AKIA35DBCFOSMW75LP7L",
  secretAccessKey:"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"
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
    getUser:async(req, res) =>{
        //const data=await User.doc("vuXrg8qfehSBCmvsfIY8").update({name:"el sexpotae"})
        const {id}=req.params
try{
        //Data basica
        const data=await User.get()
      const response=await data.docs.map(e=>{return {
         name:e._fieldsProto.name.stringValue,
         lastname:e._fieldsProto.lastname.stringValue,
         mail:e._fieldsProto.mail.stringValue,
         date:e._fieldsProto.date.stringValue,
         time:e._fieldsProto.time.stringValue,
         urlProfile:e._fieldsProto.urlProfile.stringValue,
         id:e._ref._path.segments[1]
      }})
      const dataBasica=response.filter(e=>{return e.id===id}) 

      //Post del usuario seleccionado
      const posts=await Post.get()
      const publicaciones=posts.docs.map(e=>{return {
         publicacion:e._fieldsProto.publicacion.stringValue,
         nombre:e._fieldsProto.name.stringValue,
         apellido:e._fieldsProto.lastname.stringValue,
         idUser:e._fieldsProto.idUser.stringValue,
         date:e._fieldsProto.date.stringValue,
         time:e._fieldsProto.time.stringValue,
         idPublicacion:e._ref._path.segments[1]
     }})
     const publicacionesUser=publicaciones.filter(e=>{return e.idUser===id})
     res.status(200).json({
      status:true,
      message:"Informacion recuperada exitosamente",
      dataBasica,
      publicacionesUser
     })}
     catch(e){
      res.status(400).json({
         status:false,
         message:"No se ha podido acceder al perfil"
      })
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
         message:"No existe un usuario registrado con ese correo electr??nico"
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
            message:"Usuario o contrase??a incorrectos"
         })
      }
     })
      
       
    },
    getUserData:async (req, res) =>{
      const {id}=req.params

      try{
         const data=await User.get()
      const response=await data.docs.map(e=>{return {
         name:e._fieldsProto.name.stringValue,
         lastname:e._fieldsProto.lastname.stringValue,
         mail:e._fieldsProto.mail.stringValue,
         date:e._fieldsProto.date.stringValue,
         time:e._fieldsProto.time.stringValue,
         country:e._fieldsProto.country.stringValue,
         liveCountry:e._fieldsProto.liveCountry.stringValue,
         ocupation:e._fieldsProto.ocupation.stringValue,
         birthday:e._fieldsProto.birthday.stringValue,
         urlProfile:e._fieldsProto.urlProfile.stringValue,
         id:e._ref._path.segments[1]
      }})
      const dataBasica=response.filter(e=>{return e.id===id})
 
      //Post del usuario seleccionado
      const posts=await Post.get()
      
            const publicaciones=posts.docs.map(e=>{return {
                publicacion:e._fieldsProto.publicacion.stringValue,
                nombre:e._fieldsProto.name.stringValue,
                apellido:e._fieldsProto.lastname.stringValue,
                idUser:e._fieldsProto.idUser.stringValue,
                date:e._fieldsProto.date.stringValue,
                time:e._fieldsProto.time.stringValue,
                usersComments:e._fieldsProto.usersComments.arrayValue.values.map(e=>{return {
                    name:e.mapValue.fields.name.stringValue,
                    lastname:e.mapValue.fields.lastname.stringValue,
                    time:e.mapValue.fields.time.stringValue,
                    date:e.mapValue.fields.date.stringValue,
                    comment:e.mapValue.fields.comment.stringValue,
                    idComment:e.mapValue.fields.idComment.stringValue,
                    idUser:e.mapValue.fields.idUser.stringValue
                }}),
                usersLinked:e._fieldsProto.usersLinked.arrayValue.values.map(e=>{return {
                    name:e.mapValue.fields.name.stringValue,
                    lastname:e.mapValue.fields.lastname.stringValue,
                    idLike:e.mapValue.fields.idLike.stringValue,
                    idUser:e.mapValue.fields.idUser.stringValue
                }}),
                idPublicacion:e._ref._path.segments[1]
            }})

        
            
        
         const misPublicaciones=publicaciones.filter(e=>{return e.idUser===id})
         
         res.status(200).json({
            status:true,
            message:"Informacion recuperada exitosamente",
            user:dataBasica,
            post:misPublicaciones
         })
      }
      catch(e){
         console.log(e)
         res.status(400).json({
            status:false,
            message:"No se ha podido recuperar la informacion del usuario"
         })
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
    addUser: async(req, res) => {
      const {name,lastname,mail,password,country,liveCountry,birthday,ocupation}=req.body
      const data=await User.get()
      const response=await data.docs.map(e=>{return {
         name:e._fieldsProto.name.stringValue,
         lastname:e._fieldsProto.lastname.stringValue,
         mail:e._fieldsProto.mail.stringValue,
         id:e._ref._path.segments[1]
      }})
      let date = today.toLocaleDateString()
let time = today.toLocaleTimeString() 
      const userExist=response.some(user=>user.mail===mail)
      if(userExist) return res.status(400).json({
         status:false,
         message:"Ya existe un usuario registrado con ese correo electr??nico"
      })
      try {
         bcrypt.hash(password, saltRounds,async(err, hash) =>{
            if(err) return res.status(500).json({
               status:false,
               message:"Error al crear el usuario"
            })
            User.add({
               name,lastname,mail,password:hash,date,time,country,liveCountry,birthday,ocupation,urlProfile:""
            })
            res.status(200).json({
               status:true,
               message:"Usuario creado con exito"
            })
        }); 
      }
      catch(error) {
         res.status(400).json({
            status:false,
            message:error
         })
      }
      
    } ,




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
   console.log("llegaste")
   try {
     await s3.putObject({
       Bucket:process.env.NAME_BUCKET,
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
      
     s3.getSignedUrl('getObject',{Bucket:process.env.NAME_BUCKET,
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