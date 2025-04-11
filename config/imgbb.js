const axios = require('axios');
const FormData = require('form-data');

const IMGBB_API_KEY = 'f6e97bff8770acf95feecc2b40dbd466';

const uploadImage = async (file) => {
  try {
    console.log('Iniciando subida de imagen a ImgBB...');
    console.log('Tipo de archivo:', typeof file);
    console.log('Propiedades del archivo:', Object.keys(file));
    
    if (!file || !file.data) {
      throw new Error('Archivo inválido o sin datos');
    }
    
    const formData = new FormData();
    
    // Convertir el buffer a base64
    const base64Image = file.data.toString('base64');
    console.log('Imagen convertida a base64, longitud:', base64Image.length);
    
    // Crear el FormData
    formData.append('image', base64Image);
    
    console.log('Enviando petición a ImgBB...');
    const response = await axios.post('https://api.imgbb.com/1/upload', formData, {
      params: {
        key: IMGBB_API_KEY
      },
      headers: {
        ...formData.getHeaders()
      },
      timeout: 30000 // 30 segundos de timeout
    });
    
    console.log('Respuesta de ImgBB:', response.data);

    if (response.data.success) {
      console.log('Imagen subida exitosamente');
      return response.data.data.url;
    } else {
      console.error('Error en la respuesta de ImgBB:', response.data);
      throw new Error('Error al subir la imagen a ImgBB: ' + JSON.stringify(response.data));
    }
  } catch (error) {
    console.error('Error detallado:', error);
    console.error('Respuesta de error:', error.response?.data);
    console.error('Estado de la respuesta:', error.response?.status);
    console.error('Headers de la respuesta:', error.response?.headers);
    
    if (error.code === 'ETIMEDOUT') {
      throw new Error('Tiempo de espera agotado al conectar con ImgBB. Por favor, verifica tu conexión a internet e intenta nuevamente.');
    } else if (error.response?.status === 400) {
      throw new Error('Error de autenticación con ImgBB. Verifica que la API key sea correcta.');
    } else if (error.response?.status === 413) {
      throw new Error('La imagen es demasiado grande. El tamaño máximo permitido es 32MB.');
    } else {
      throw new Error(`Error al subir la imagen: ${error.response?.data?.error?.message || error.message}`);
    }
  }
};

module.exports = {
  uploadImage
}; 