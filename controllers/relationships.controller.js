const {RelationShip} = require('../config/db');
module.exports={
    allFollows:async(req,res)=>{
        
        try{
            const data=await RelationShip.get()
            
            const datos=data.docs.map(e=>{return {
                idUser:e._fieldsProto.idUser.stringValue,
                idFollowed:e._fieldsProto.idFollowed.stringValue,
                idFollow:e._ref._path.segments[1]
            }})
            res.status(200).json({
                status:true,
                message:"Seguidores conseguidos exitosamente",
                datos
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
    addFollow: async(req,res) => {
        const {idUser}=req.params
        const {idFollowed}=req.params
        
        try{
            await RelationShip.add({
                idUser: idUser,
                idFollowed
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