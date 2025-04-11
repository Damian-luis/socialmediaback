#!/bin/bash

# Puertos que queremos liberar
PORTS=(3006 3007)

# Función para matar procesos en un puerto
kill_port() {
    local port=$1
    echo "Buscando procesos en puerto $port..."
    
    # Obtener PID del proceso usando el puerto
    local pid=$(lsof -ti :$port)
    
    if [ ! -z "$pid" ]; then
        echo "Matando proceso $pid en puerto $port..."
        kill -9 $pid 2>/dev/null
        sleep 1
    else
        echo "No hay procesos usando el puerto $port"
    fi
}

# Matar procesos en todos los puertos especificados
for port in "${PORTS[@]}"; do
    kill_port $port
done

# Esperar un momento para asegurarnos que los puertos están liberados
sleep 1

# Iniciar el servidor con nodemon
echo "Iniciando servidor..."
npm run dev 