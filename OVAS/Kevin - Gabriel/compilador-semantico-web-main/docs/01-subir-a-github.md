# 01. Guía para subir el proyecto a GitHub

Esta guía explica cómo subir el proyecto **Compilador Semántico Web** a GitHub para luego conectarlo con Dokploy.

---

## 1. Preparar la carpeta del proyecto

Primero asegúrate de tener la carpeta descomprimida.

La estructura debe verse más o menos así:

```txt
compilador-semantico-web/
├── index.html
├── styles.css
├── analyzer.js
├── Dockerfile
├── docker-compose.yml
├── README.md
└── docs/
```

No subas únicamente el archivo `.zip`. Lo correcto es subir los archivos y carpetas del proyecto.

---

## 2. Crear el repositorio en GitHub

Entra a GitHub y crea un repositorio nuevo.

Nombre recomendado:

```txt
compilador-semantico-web
```

Configuración sugerida:

| Opción | Valor recomendado |
|---|---|
| Repository name | `compilador-semantico-web` |
| Visibility | Public o Private |
| Add README | No marcar |
| Add .gitignore | No marcar |
| Add license | No marcar |

No marques README ni licencia porque este proyecto ya incluye esos archivos.

---

## 3. Abrir terminal en la carpeta

En Windows puedes hacer esto:

1. Abre la carpeta del proyecto.
2. Clic derecho dentro de la carpeta.
3. Selecciona **Open Git Bash here** o **Abrir en terminal**.

---

## 4. Inicializar Git

Ejecuta:

```bash
git init
```

Esto crea el control de versiones dentro de la carpeta.

---

## 5. Crear la rama principal

```bash
git branch -M main
```

Esto deja la rama principal con el nombre `main`, que es el estándar actual en GitHub.

---

## 6. Agregar archivos

```bash
git add .
```

Este comando prepara todos los archivos para el primer commit.

---

## 7. Crear el primer commit

```bash
git commit -m "Primer despliegue del compilador semantico"
```

El commit es como una foto del estado actual del proyecto.

---

## 8. Conectar con el repositorio remoto

Copia la URL de tu repositorio en GitHub.

Ejemplo:

```txt
https://github.com/GabitoMIX/compilador-semantico-web.git
```

Luego ejecuta:

```bash
git remote add origin https://github.com/TU_USUARIO/compilador-semantico-web.git
```

Cambia `TU_USUARIO` por tu usuario real de GitHub.

Ejemplo:

```bash
git remote add origin https://github.com/GabitoMIX/compilador-semantico-web.git
```

---

## 9. Subir el proyecto

```bash
git push -u origin main
```

Si GitHub te pide iniciar sesión, puedes hacerlo desde el navegador o usando un token personal.

---

## 10. Verificar que quedó bien

Entra al repositorio desde el navegador y verifica que estén estos archivos:

```txt
index.html
styles.css
analyzer.js
Dockerfile
docker-compose.yml
README.md
docs/
```

Si aparecen, el proyecto ya quedó listo para conectarlo con Dokploy.

---

## Comandos completos

```bash
git init
git branch -M main
git add .
git commit -m "Primer despliegue del compilador semantico"
git remote add origin https://github.com/TU_USUARIO/compilador-semantico-web.git
git push -u origin main
```

---

## Si te sale error de remote existente

Si aparece algo como:

```txt
remote origin already exists
```

Puedes cambiar la URL con:

```bash
git remote set-url origin https://github.com/TU_USUARIO/compilador-semantico-web.git
```

Y luego:

```bash
git push -u origin main
```

---

## Si necesitas actualizar después

Cuando edites algo y quieras subir cambios:

```bash
git add .
git commit -m "Actualizacion del proyecto"
git push
```

Ese será el flujo normal de trabajo.
