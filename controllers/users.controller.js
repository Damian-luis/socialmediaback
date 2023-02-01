var jwt = require('jsonwebtoken');
const {User,Post} = require('../config/db');
const bcrypt = require('bcrypt');
const saltRounds = 10;
let today = new Date();
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
               var token = jwt.sign({ id:user.id }, process.env.SECRET_KEY,{expiresIn: '30s'});
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
                  contraseñaInput:password,
                  contraseñaDb:user[0].password
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
      const {name,lastname,mail,password}=req.body
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
         message:"Ya existe un usuario registrado con ese correo electrónico"
      })
      try {
         bcrypt.hash(password, saltRounds,async(err, hash) =>{
            if(err) return res.status(500).json({
               status:false,
               message:"Error al crear el usuario"
            })
            User.add({
               name,lastname,mail,password:hash,date,time
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
      
    } 
}
//User.add({data}),User.get() data.docs.data,User.doc(id).update() the same with delete()