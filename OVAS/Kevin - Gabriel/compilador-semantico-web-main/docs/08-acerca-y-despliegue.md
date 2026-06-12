# Acerca del proyecto y despliegue

## Autores

- Gabriel Argenis Medina Carrero
- Kevin Garcia

## Información académica

- Universidad Simón Bolívar
- Sede Cúcuta
- Ingeniería de Sistemas
- Curso: Teoría de Compiladores
- Docente evaluador: Álvaro Salamanca

## Propósito del proyecto

El proyecto permite visualizar el análisis semántico de un compilador mediante una página web interactiva. El usuario puede escribir código de un minilenguaje, analizarlo y revisar tokens, errores, tabla de símbolos, explicación del proceso y código intermedio.

## Despliegue

El proyecto se publica usando el siguiente flujo:

```txt
GitHub → Webhook → Dokploy → Docker Compose → Nginx → Cosmos → Dominio público
```

- **GitHub:** almacena el código fuente.
- **Webhook:** notifica a Dokploy cuando hay cambios.
- **Dokploy:** construye y levanta el contenedor.
- **Docker Compose:** define el servicio web.
- **Nginx:** sirve los archivos estáticos.
- **Cosmos:** recibe el dominio y actúa como proxy inverso.
