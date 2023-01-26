const {Post,RelationShip} = require('../config/db');
module.exports={
    getAllPosts:async(req,res)=>{
        
        const {idUser}=req.params

        try{
            
            const data=await RelationShip.get()
            const myFriends=data.docs.filter(e=>{return e._fieldsProto.idUser.stringValue===idUser})
            
            const datos=myFriends.map(e=>{return {
                idUser:e._fieldsProto.idUser.stringValue,
                idFollowed:e._fieldsProto.idFollowed.stringValue,
                idFollow:e._ref._path.segments[1]
            }})
            
            const posts=await Post.get()
            const publicaciones=posts.docs.map(e=>{return {
                publicacion:e._fieldsProto.publicacion.stringValue,
                nombre:e._fieldsProto.name.stringValue,
                apellido:e._fieldsProto.lastname.stringValue,
                idUser:e._fieldsProto.idUser.stringValue,
                idPublicacion:e._ref._path.segments[1]
            }})

const myFriendsPosts= publicaciones.filter(obj1 => datos.some(obj2 => obj1.idUser === obj2.idFollowed));
            const myPosts=publicaciones.filter(e=>{return e.idUser===idUser})
            res.status(200).json({
                status:true,
                message:"Publicaciones recuperadas exitosamente",
                publicacionesAmigos:myFriendsPosts,
                misPublicaciones:myPosts
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
        try{
            await Post.add({
                name,
                lastname,
                publicacion,
                idUser
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
        try{
            await Post.doc(idPublicacion).delete()
            res.status(400).json({
                status:false,
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