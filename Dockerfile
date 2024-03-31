# Usa una imagen base de Node.js
FROM node:14

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia los archivos de dependencia
COPY package.json package-lock.json ./

# Instala las dependencias, incluido bcrypt

# Copia el resto de los archivos de la aplicación
COPY . .

# Expone el puerto de la aplicación
EXPOSE 3006

# Define el comando para ejecutar la aplicación
CMD ["npm", "run", "dev"]

