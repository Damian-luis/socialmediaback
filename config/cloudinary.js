const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');
require('dotenv').config();

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadImage = async (file) => {
  try {
    console.log('Subiendo imagen a Cloudinary...');
    
    if (!file || !file.data) {
      throw new Error('Archivo inválido o sin datos');
    }
    
    // Verificar que el archivo tenga datos
    if (file.data.length === 0) {
      throw new Error('El archivo está vacío');
    }
    
    console.log('Tamaño del archivo:', file.data.length, 'bytes');
    console.log('Tipo de archivo:', file.mimetype);
    
    // Convertir el buffer a base64
    const base64Image = file.data.toString('base64');
    console.log('Longitud de la imagen en base64:', base64Image.length);
    
    // Subir directamente usando upload_stream
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'auto',
          folder: 'socialmedia'
        },
        (error, result) => {
          if (error) {
            console.error('Error al subir a Cloudinary:', error);
            reject(new Error(`Error al subir la imagen: ${error.message}`));
          } else {
            console.log('Imagen subida exitosamente');
            resolve(result.secure_url);
          }
        }
      );
      
      // Escribir el buffer directamente al stream
      uploadStream.end(file.data);
    });
  } catch (error) {
    console.error('Error al subir la imagen:', error.message);
    
    if (error.code === 'ETIMEDOUT') {
      throw new Error('Tiempo de espera agotado al conectar con Cloudinary');
    } else if (error.response?.status === 400) {
      throw new Error('Error al subir la imagen. Verifica el formato y tamaño del archivo.');
    } else if (error.response?.status === 413) {
      throw new Error('La imagen es demasiado grande. El tamaño máximo permitido es 32MB.');
    } else {
      throw new Error(`Error al subir la imagen: ${error.message}`);
    }
  }
};

module.exports = {
  uploadImage
}; 