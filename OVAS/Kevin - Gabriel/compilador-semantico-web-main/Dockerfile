# Imagen base liviana con Nginx para servir archivos estaticos.
FROM nginx:1.27-alpine

# Copia todo el proyecto dentro de la carpeta publica de Nginx.
# Si se cambian index.html, styles.css o analyzer.js, se debe reconstruir la imagen.
COPY . /usr/share/nginx/html

# Puerto interno del contenedor. Docker Compose lo publica como 8097:80.
EXPOSE 80
