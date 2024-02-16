const {RelationShip} = require('../config/db');
const {Messages} = require('../config/db');
let today = new Date();
module.exports={
    getMessages: async (req, res) => {
        const userId = req.params.userId;
    
        try {
            const senderMessages = await Messages.where("from", "==", userId).get();
            const receiverMessages = await Messages.where("to", "==", userId).get();
        
            const senderMessagesData = senderMessages.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
        
            const receiverMessagesData = receiverMessages.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
        
            const allMessages = [...senderMessagesData, ...receiverMessagesData];
        
            res.json(allMessages);
          } catch (error) {
            console.error("Error al obtener mensajes para el usuario desde Firebase:", error);
            res.status(500).json({ error: "Error al obtener mensajes para el usuario" });
          }
    }
}