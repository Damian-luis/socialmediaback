const { Post } = require('../config/db');
const { uploadImage } = require('../config/cloudinary');

module.exports = {
  uploadPhotos: async (req, res) => {
    try {
      console.log('Iniciando proceso de subida de fotos...');
      console.log('Headers:', req.headers['content-type']);
      
      const { name, lastname, idUser } = req.params;
      const { description } = req.body;
      
      console.log('Datos de la petición:', {
        name,
        lastname,
        idUser,
        description,
        filesExist: !!req.files,
        filesKeys: req.files ? Object.keys(req.files) : []
      });

      if (!req.files || !req.files.photos) {
        console.log('No se encontraron archivos en la petición');
        return res.status(400).json({
          status: false,
          message: "No se han proporcionado imágenes"
        });
      }

      let photos = req.files.photos;
      if (!Array.isArray(photos)) {
        photos = [photos];
      }

      console.log(`Procesando ${photos.length} foto(s)...`);
      
      // Validar cada foto antes de subir
      for (const photo of photos) {
        console.log('Validando foto:', {
          name: photo.name,
          size: photo.size,
          mimetype: photo.mimetype,
          encoding: photo.encoding,
          tempFilePath: photo.tempFilePath,
          truncated: photo.truncated,
          dataLength: photo.data ? photo.data.length : 0
        });

        if (!photo.data || photo.data.length === 0) {
          return res.status(400).json({
            status: false,
            message: `La foto ${photo.name} está vacía`
          });
        }

        if (photo.size > 32 * 1024 * 1024) {
          return res.status(400).json({
            status: false,
            message: `La foto ${photo.name} excede el tamaño máximo permitido de 32MB`
          });
        }

        if (!photo.mimetype.startsWith('image/')) {
          return res.status(400).json({
            status: false,
            message: `El archivo ${photo.name} no es una imagen válida`
          });
        }
      }

      // Subir todas las fotos
      console.log('Iniciando subida de fotos a Cloudinary...');
      const uploadPromises = photos.map(photo => uploadImage(photo));
      const photoUrls = await Promise.all(uploadPromises);
      console.log('URLs de las fotos subidas:', photoUrls);

      // Crear el post
      const today = new Date();
      await Post.add({
        name,
        lastname,
        idUser,
        date: today.toLocaleDateString(),
        time: today.toLocaleTimeString(),
        type: 'photo',
        publicacion: description || '',
        photos: photoUrls,
        usersLinked: [],
        usersComments: []
      });

      console.log('Post creado exitosamente');
      res.status(200).json({
        status: true,
        message: "Fotos subidas exitosamente",
        urls: photoUrls
      });
    } catch (error) {
      console.error('Error en uploadPhotos:', error);
      res.status(500).json({
        status: false,
        message: error.message || "Error al subir las fotos"
      });
    }
  }
}; 