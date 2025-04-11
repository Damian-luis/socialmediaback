const axios = require('axios');
const FormData = require('form-data');

const uploadImage = async (file) => {
  try {
    console.log('Subiendo imagen a FreeImage.Host...');
    
    if (!file || !file.data) {
      throw new Error('Archivo inválido o sin datos');
    }
    
    const formData = new FormData();
    
    // Convertir el buffer a base64
    const base64Image = file.data.toString('base64');
    
    // Crear el FormData con el formato correcto para FreeImage.Host
    formData.append('source', base64Image);
    
    // Usar el endpoint correcto de FreeImage.Host
    const response = await axios.post('https://freeimage.host/api/1/upload', formData, {
      headers: {
        ...formData.getHeaders()
      },
      timeout: 30000 // 30 segundos de timeout
    });
    
    if (response.data && response.data.image && response.data.image.url) {
      console.log('Imagen subida exitosamente');
      return response.data.image.url;
    } else {
      throw new Error('Error al subir la imagen: Respuesta inválida del servidor');
    }
  } catch (error) {
    console.error('Error al subir la imagen:', error.message);
    
    if (error.code === 'ETIMEDOUT') {
      throw new Error('Tiempo de espera agotado al conectar con FreeImage.Host');
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