# 02. Despliegue en Dokploy y proxy con Cosmos Cloud

Esta guía explica cómo publicar el proyecto usando el flujo:

```txt
GitHub → Dokploy → Docker/Nginx → Cosmos Cloud → dominio público
```

La ventaja de este flujo es que el código queda ordenado en GitHub, Dokploy se encarga de construir y levantar el contenedor, y Cosmos Cloud funciona como entrada segura mediante reverse proxy.

---

## 1. Requisitos

Antes de empezar necesitas:

- Proyecto subido a GitHub.
- Dokploy funcionando en tu servidor.
- Cosmos Cloud funcionando como reverse proxy.
- Un dominio o subdominio disponible.
- Docker instalado en el servidor donde corre Dokploy.

Ejemplo de subdominio:

```txt
dominio-del-proyecto.example
```

---

## 2. Revisar el docker-compose.yml

El proyecto ya incluye este archivo:

```yml
services:
  compilador-semantico:
    build: .
    container_name: compilador-semantico-web
    restart: unless-stopped
    ports:
      - "8097:80"
```

Esto significa:

| Línea | Explicación |
|---|---|
| `build: .` | Dokploy construye la imagen usando el `Dockerfile` del proyecto. |
| `container_name` | Nombre del contenedor. |
| `restart: unless-stopped` | El contenedor se reinicia automáticamente si el servidor se reinicia. |
| `8097:80` | El puerto `8097` del servidor apunta al puerto `80` interno de Nginx. |

---

## 3. Crear el servicio en Dokploy

En Dokploy:

1. Entra al panel de Dokploy.
2. Crea un nuevo proyecto.
3. Crea un nuevo servicio tipo **Docker Compose**.
4. Conecta el repositorio de GitHub.
5. Selecciona el repositorio del proyecto.
6. Indica que el archivo compose es:

```txt
docker-compose.yml
```

7. Ejecuta el despliegue.

Dokploy debería construir la imagen y levantar el contenedor.

---

## 4. Verificar que el contenedor funciona

Desde el servidor o desde tu red local, prueba:

```txt
http://IP_DEL_SERVIDOR_DOKPLOY:8097
```

Ejemplo:

```txt
http://IP_DEL_SERVIDOR:8097
```

Si la página carga, Dokploy ya hizo su parte.

---

## 5. Crear el proxy en Cosmos Cloud

En Cosmos Cloud crea una URL o ruta nueva.

Configuración sugerida:

| Campo | Valor |
|---|---|
| Hostname / Domain | `dominio-del-proyecto.example` |
| Target / Destination | `http://IP_DEL_SERVIDOR:8097` |
| HTTPS | Activado |
| Protección | Opcional según la exposición |

Ejemplo:

```txt
Dominio: dominio-del-proyecto.example
Destino: http://IP_DEL_SERVIDOR:8097
```

---

## 6. DNS en Cloudflare o proveedor del dominio

Si usas Cloudflare, crea un registro DNS para el subdominio.

Ejemplo:

| Tipo | Nombre | Destino |
|---|---|---|
| A | `compilador` | IP pública de tu casa/servidor |
| CNAME | `compilador` | dominio principal o túnel, si aplica |

La idea es que el tráfico llegue primero a Cosmos, no directamente al contenedor.

---

## 7. Flujo final

```txt
Usuario entra a:
https://dominio-del-proyecto.example

↓

Cloudflare / DNS manda al servidor donde está Cosmos

↓

Cosmos recibe la solicitud y aplica HTTPS/proxy

↓

Cosmos redirige internamente a:
http://IP_DEL_SERVIDOR:8097

↓

Dokploy mantiene el contenedor activo

↓

Nginx sirve la página web del compilador semántico
```

---

## 8. ¿Por qué usar Cosmos como proxy?

Porque así no expones cada aplicación individualmente. Cosmos funciona como una puerta de entrada para tus servicios publicados.

En este proyecto, el contenedor no necesita manejar certificados HTTPS ni dominios. Solo sirve la web en el puerto `8097`, y Cosmos se encarga de mostrarla con un dominio bonito.

---

## 9. Posibles errores y soluciones

### Error: la página no carga desde el dominio

Revisa:

- Que el contenedor esté arriba en Dokploy.
- Que el puerto `8097` esté publicado.
- Que Cosmos apunte al IP correcto del servidor Dokploy.
- Que el DNS apunte a Cosmos.
- Que no estés usando `https://` en el destino interno si el contenedor solo sirve `http://`.

Destino correcto:

```txt
http://IP_DEL_SERVIDOR:8097
```

No recomendado como destino interno:

```txt
https://IP_DEL_SERVIDOR:8097
```

---

### Error: Dokploy no encuentra el Dockerfile

Revisa que el `Dockerfile` esté en la raíz del repositorio.

Debe existir:

```txt
Dockerfile
```

No debe estar dentro de otra carpeta adicional por accidente.

---

### Error: el puerto ya está en uso

Puedes cambiar el puerto en `docker-compose.yml`.

Ejemplo:

```yml
ports:
  - "8098:80"
```

Luego en Cosmos también actualizas el destino:

```txt
http://IP_DEL_SERVIDOR:8098
```

---

## 10. Comando para probar manualmente en el servidor

Si quieres probar sin Dokploy:

```bash
docker compose up -d --build
```

Ver logs:

```bash
docker compose logs -f
```

Detener:

```bash
docker compose down
```

---

## 11. Recomendación para presentación

Para presentar en clase, abre primero:

```txt
https://dominio-del-proyecto.example
```

Y ten como respaldo la IP local:

```txt
http://IP_DEL_SERVIDOR:8097
```

Así, si el dominio falla por DNS o internet, todavía puedes mostrar la demo desde la red local.

---

## 12. Referencias

- Dokploy: <https://docs.dokploy.com/>
- Cosmos Cloud: <https://cosmos-cloud.io/docs/>
