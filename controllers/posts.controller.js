const {Post,RelationShip} = require('../config/db');
let today = new Date();
module.exports={
    getAllPosts:async(req,res)=>{
        
        const {idUser}=req.params

        try{
            
            const data=await RelationShip.get()
            const myFriends=data.docs.filter(e=>{return e._fieldsProto.idUser.stringValue===idUser})
            
            const datos=myFriends.map(e=>{return {
                idUser:e._fieldsProto.idUser.stringValue,
                idFollowed:e._fieldsProto.idFollowed.stringValue,
                date:e._fieldsProto.date.stringValue,
                time:e._fieldsProto.time.stringValue,
                idFollow:e._ref._path.segments[1]
            }})
            
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

            
            let myFriendsPosts= publicaciones.filter(obj1 => datos.some(obj2 => obj1.idUser === obj2.idFollowed));
            
            for(let i = 0; i < myFriendsPosts.length; i++){
               
                for(let j = 0; j < myFriendsPosts[i].usersLinked.length; j++){
                    
                    if(myFriendsPosts[i].usersLinked[j].idUser===idUser){
                        
                        myFriendsPosts[i].like=true;
                        
                    }
                    
                } 
            }
            const myPosts=publicaciones.filter(e=>{return e.idUser===idUser})
            res.status(200).json({
                status:true,
                message:"Publicaciones recuperadas exitosamente",
                publicacionesAmigos:myFriendsPosts,
                misPublicaciones:myPosts,
            }) 
        }
        catch(e){ 
            console.log(e)
            res.status(400).json({
                status:false,
                message:"No se han podido recuperar las publicaciones"
            })
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