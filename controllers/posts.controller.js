const {Post,RelationShip,User} = require('../config/db');
let today = new Date();
module.exports={
    getAllPosts: async (req, res) => {
        const { idUser } = req.params;
        try {
            const posts = await Post.get();
            const userData = await User.get();
            
            const postsData = posts.docs.map((doc) => {
                const data = doc.data();
                return {
                    id: doc.id,
                    idUser: data.idUser,
                    content: data.content || data.publicacion || '',
                    urlImage: data.urlImage || '',
                    date: data.date || today.toLocaleDateString(),
                    time: data.time || today.toLocaleTimeString(),
                    likes: data.likes || data.usersLinked || [],
                    comments: data.comments || data.usersComments || [],
                    name: data.name || '',
                    lastname: data.lastname || '',
                    type: data.type || 'text',
                    photos: data.photos || []
                };
            });

            const userDataMap = userData.docs.reduce((acc, doc) => {
                const data = doc.data();
                acc[doc.id] = {
                    name: data.name || '',
                    lastname: data.lastname || '',
                    urlProfile: data.urlProfile || ''
                };
                return acc;
            }, {});

            const postsWithUserData = postsData.map(post => ({
                ...post,
                user: userDataMap[post.idUser] || {
                    name: 'Usuario',
                    lastname: 'Desconocido',
                    urlProfile: ''
                }
            }));

            res.status(200).json({
                status: true,
                message: "Posts obtenidos exitosamente",
                posts: postsWithUserData
            });
        } catch (error) {
            console.error('Error getting posts:', error);
            res.status(400).json({
                status: false,
                message: "No se han podido recuperar los posts"
            });
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
        
    },
    allPosts: async (req, res) => {
        try {
            const userId = req.user.id;
            
            // Obtener amigos del usuario
            const friendships = await RelationShip
                .where('senderId', '==', userId)
                .where('status', '==', 'accepted')
                .get();

            const friendIds = friendships.docs.map(doc => doc.data().receiverId);
            
            // Obtener posts del usuario y sus amigos
            const postsQuery = await Post
                .where('idUser', 'in', [userId, ...friendIds])
                .orderBy('timestamp', 'desc')
                .get();

            const posts = await Promise.all(postsQuery.docs.map(async (doc) => {
                const postData = doc.data();
                const userDoc = await User.doc(postData.idUser).get();
                const userData = userDoc.data();

                return {
                    ...postData,
                    idPublicacion: doc.id,
                    user: {
                        name: userData.name,
                        lastname: userData.lastname,
                        urlProfile: userData.urlProfile
                    }
                };
            }));

            res.status(200).json({
                status: true,
                message: "Posts obtenidos exitosamente",
                posts
            });
        } catch (error) {
            console.error('Error getting posts:', error);
            res.status(500).json({
                status: false,
                message: "Error al obtener los posts"
            });
        }
    }
}