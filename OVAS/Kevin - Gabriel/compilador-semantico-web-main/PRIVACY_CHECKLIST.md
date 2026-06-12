# Checklist de privacidad para entrega académica

Esta carpeta corresponde a una versión limpia del proyecto para revisión del docente.

## Se eliminó o reemplazó

- Carpeta `.git/` e historial interno, si existía.
- Direcciones IP internas reales.
- Dominio público real del entorno personal.
- Referencias directas a infraestructura privada.
- Marcas de conflicto de Git, si existían.

## Se conserva

- Código fuente del proyecto.
- Interfaz completa.
- Imágenes y recursos necesarios para que la página se vea igual.
- Documentación académica.
- Dockerfile y docker-compose.yml para ejecutar el proyecto.
- Información académica del proyecto.

## Revisión recomendada antes de enviar

Buscar en todo el proyecto:

```txt
.env
API_KEY
TOKEN
SECRET
PASSWORD
<<<<<<<
=======
>>>>>>>
192.168.
argeworks.com
```

Si alguno aparece por accidente, debe revisarse antes de entregar.
