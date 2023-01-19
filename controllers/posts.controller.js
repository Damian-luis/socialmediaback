const {Post} = require('../config/db');
module.exports={
    getAllPosts:async(req,res)=>{
        try{
            const data=await Post.get()
            const publicaciones=data.docs.map(e=>{return {
                publicacion:e._fieldsProto.publicacion.stringValue,
                idUser:e._fieldsProto.idUser.stringValue,
                idPublicacion:e._ref._path.segments[1]
            }})
            res.status(200).json({
                status:true,
                message:"Publicaciones recuperadas exitosamente",
                publicaciones
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
        const {id}=req.params
        const {publicacion}=req.body
        try{
            await Post.add({
                idUser: id,
                publicacion
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