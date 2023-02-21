const {RelationShip} = require('../config/db');
const {User,Post} = require('../config/db');
const { v4: uuidv4 } = require('uuid');
let today = new Date();
module.exports={
    react:async(req,res)=>{
        const {idUserLiked,idPublicacion,name,lastname}=req.params
        //await Post.doc(idPublicacion).update({usersLiked:})
        try{
            const posts=await Post.get()
           
            
            const publicaciones=posts.docs.map(e=>{return {
                publicacion:e._fieldsProto.publicacion.stringValue,
                nombre:e._fieldsProto.name.stringValue,
                apellido:e._fieldsProto.lastname.stringValue,
                idUser:e._fieldsProto.idUser.stringValue,
                date:e._fieldsProto.date.stringValue,
                time:e._fieldsProto.time.stringValue,
                usersLinked:e._fieldsProto.usersLinked.arrayValue.values.map(e=>{return {
                    name:e.mapValue.fields.name.stringValue,
                    lastname:e.mapValue.fields.lastname.stringValue,
                    idLike:e.mapValue.fields.idLike.stringValue,
                    idUser:e.mapValue.fields.idUser.stringValue
                }}),
                idPublicacion:e._ref._path.segments[1]
            }})
            let publicacion=publicaciones.filter(e=>{return e.idPublicacion===idPublicacion})
            let newReact=publicacion[0].usersLinked
             
            const reactExist=newReact.find(e=>{return e.idLike===idUserLiked})
            
          if(reactExist){
            newReact=newReact.filter(e=>{return e.idLike!==idUserLiked})
            await Post.doc(idPublicacion).update({usersLinked:newReact})
            res.status(200).json({ 
                status:true,
                message:"Reaccion quitada",
                newReact
            })
          }
          else{
            newReact.push({name:name,lastname:lastname,idLike:idUserLiked,idUser:idUserLiked})
           await Post.doc(idPublicacion).update({usersLinked:newReact})
            res.status(200).json({ 
                status:true,
                message:"Has reaccionado a esta publicacion",
                newReact
            })
          }
          
           // 
            
            
        } 
        catch(e){
            console.log(e)
            res.status(400).json({
                status:false,
                message:"No se han podido recuperar las publicaciones"
            })
        }
        
    },
    postComment: async(req,res) => {
        const {idFriend,idPublicacion,name,lastname}=req.params
        
        const comment=req.body.comment
        console.log(comment) 
        let date = today.toLocaleDateString()
let time = today.toLocaleTimeString() 

        try{
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
           
            let publicacion=publicaciones.filter(e=>{return e.idPublicacion===idPublicacion})
            
            let newComment=publicacion[0].usersComments
            newComment.push({
                name,
                lastname,
                comment,
                date,
                time,
                idUser:idFriend,
                idComment:uuidv4()
            })
            
            await Post.doc(idPublicacion).update({usersComments:newComment})
            res.status(200).json({
                status:true,
                message:"Se ha añadido tu comentario",
                publicaciones
            })
        }
        catch(err){
            console.log(err)
            res.status(400).json({
                status:false,
                message:"No se pudo añadir tu comentario",
            })
        }
        
    },
    updateComment:async(req, res) =>{
        const {idUser,idPublicacion,name,lastname,idComment}=req.params
        const comment=req.body.comment
        let date = today.toLocaleDateString()
let time = today.toLocaleTimeString() 

try{
    const posts=await Post.get()
   
    
    const publicaciones=posts.docs.map(e=>{return {
        publicacion:e._fieldsProto.publicacion.stringValue,
        nombre:e._fieldsProto.name.stringValue,
        apellido:e._fieldsProto.lastname.stringValue,
        idUser:e._fieldsProto.idUser.stringValue,
        date:e._fieldsProto.date.stringValue,
        time:e._fieldsProto.time.stringValue,
        usersLinked:e._fieldsProto.usersLinked.arrayValue.values.map(e=>{return {
            name:e.mapValue.fields.name.stringValue,
            lastname:e.mapValue.fields.lastname.stringValue,
            idLike:e.mapValue.fields.idLike.stringValue
        }}),
        usersComments:e._fieldsProto.usersComments.arrayValue.values.map(e=>{return {
            name:e.mapValue.fields.name.stringValue,
            lastname:e.mapValue.fields.lastname.stringValue,
            date:e.mapValue.fields.date.stringValue,
            time:e.mapValue.fields.time.stringValue,
            comment:e.mapValue.fields.comment.stringValue,
            idComment:e.mapValue.fields.idComment.stringValue
        }}),
        idPublicacion:e._ref._path.segments[1]
    }})
    
    let publicacion=publicaciones.filter(e=>{return e.idPublicacion===idPublicacion})
    let commentToUpdate=publicacion[0].usersComments.filter(e=>{return e.idComment === idComment})
    let comments=publicacion[0].usersComments
    
    commentToUpdate[0].comment=comment
    commentToUpdate[0].date=date
    commentToUpdate[0].time=time

    /*const updateData = (comments, idComment, commentToUpdate) => {
        return comments.map(item => {
          if (item.idComment === idComment) {
            return { ...item, ...commentToUpdate };
          }
          return item;
        });
      };
    
      const updatedArray = updateData(comments, idComment, commentToUpdate)
      console.log(updatedArray)
*/

    await Post.doc(idPublicacion).update({usersComments:comments})
    res.status(200).json({
        status:true,
        message:"Tu comentario se ha actualizado",
        
    })
}
catch(err){
    console.log(err)
    res.status(400).json({
        status:false,
        message:"No se pudo actualizar tu comentario",
    })
}

    },
    deleteComment:async(req, res) =>{

        const {idComment,idPublicacion}=req.params


        try{
            const posts=await Post.get()
           const data=posts.docs
            
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
                    idComment:e.mapValue.fields.idComment.stringValue
                }}),
                usersLinked:e._fieldsProto.usersLinked.arrayValue.values.map(e=>{return {
                    name:e.mapValue.fields.name.stringValue,
                    lastname:e.mapValue.fields.lastname.stringValue,
                    idLike:e.mapValue.fields.idLike.stringValue
                }}),
                
                idPublicacion:e._ref._path.segments[1]
            }})
             
            let publicacion=publicaciones.filter(e=>{return e.idPublicacion===idPublicacion})
            
            
            let deleteComment=publicacion[0].usersComments.filter(e=>{return e.idComment !== idComment})
            
            await Post.doc(idPublicacion).update({usersComments:deleteComment})
            res.status(200).json({
                status:true,
                message:"Comentario eliminado exitosamente",
                publicacion
            })
        }
        catch(err){
            console.log(err)
            res.status(400).json({
                status:false,
                message:"No se pudo eliminar tu comentario",
            })
        }

    }
}