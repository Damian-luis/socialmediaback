const {RelationShip} = require('../config/db');
const {User} = require('../config/db');
let today = new Date();
module.exports={
    allFollows:async(req,res)=>{
        const {idUser}=req.params
        const {idFollowed}=req.params
        try{
            const data=await User.get()
            const response=await data.docs.map(e=>{return {
               name:e._fieldsProto.name.stringValue,
               lastname:e._fieldsProto.lastname.stringValue,
               mail:e._fieldsProto.mail.stringValue,
               id:e._ref._path.segments[1]
            }})


            const relacionesData=await RelationShip.get()
            
            const relaciones=relacionesData.docs.map(e=>{return {
                idUser:e._fieldsProto.idUser.stringValue,
                idFollowed:e._fieldsProto.idFollowed.stringValue,
                name:e._fieldsProto.name.stringValue,
                lastname:e._fieldsProto.lastname.stringValue,
                mail:e._fieldsProto.mail.stringValue,
                date:e._fieldsProto.date.stringValue,
                time:e._fieldsProto.time.stringValue,
                idFollow:e._ref._path.segments[1]
            }})
            //const datos=response.filter(obj1 => datosId.some(obj2 => obj1.id === obj2.idFollowed));
            console.log(response)
            const friends=relaciones.filter(e=>{return e.idUser===idUser})
            const noFriends=response.filter(e=>{return e.id!==idUser})
            console.log(idUser)
            res.status(200).json({ 
                status:true,
                message:"Seguidores conseguidos exitosamente",
                friends,
                noFriends
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
        const {idUser,idFollowed,name,lastname,mail}=req.params
        let date = today.toLocaleDateString()
let time = today.toLocaleTimeString() 
        try{
            await RelationShip.add({
                idUser,
                idFollowed,
                name,
                lastname,
                mail,
                date,
                time
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