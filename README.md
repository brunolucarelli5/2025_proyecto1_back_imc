# 📄 Calculadora IMC – Despliegue Backend

Este documento describe los pasos reproducibles para desplegar el **backend** de la aplicación **Calculadora IMC** desarrollado en NestJS.

---

## 🔧 Requisitos Previos
- Servidor con Ubuntu 24.04+  
- Acceso SSH habilitado  
- Node.js y npm instalados  
- Nginx instalado y habilitado  
- PM2 instalado globalmente (`npm install -g pm2`)  
- Dominio o subdominio configurado en DNS (por ejemplo, en Cloudflare)

---

## 🖥️ Paso 1 – Preparación Local
```bash
git clone https://github.com/brunolucarelli5/2025_proyecto1_back_imc
cd 2025_proyecto1_back_imc
npm install
npm run build
```
Esto compila el código TypeScript en `dist/`.

---

## 🌐 Paso 2 – Despliegue en el Servidor

1. Subir el código al servidor:
```bash
scp -r . root@<IP_DEL_DROPLET>:/var/www/backend/
```

2. Instalar dependencias y ejecutar con PM2:
```bash
cd /var/www/backend
npm install
pm2 start dist/main.js --name backend
pm2 save
pm2 startup
```

3. Configurar Nginx como proxy inverso:
```nginx
server {
    listen 80;
    server_name avanzada-back.probit.com.ar;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

4. Activar configuración y reiniciar Nginx:
```bash
ln -s /etc/nginx/sites-available/backend.conf /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

---

## 🚧 Problemas Frecuentes

| Problema | Solución |
|---------|-----------|
| El backend se detiene al cerrar SSH | Ejecutar con **PM2** y guardar configuración (`pm2 save`) |
| Error de CORS | Habilitar CORS en el backend (`app.enableCors()`) |
| HTTPS no funciona | Instalar y configurar Certbot con plugin Nginx |

---

## 🌍 URL Desplegada
[https://avanzada-back.probit.com.ar](https://avanzada-back.probit.com.ar)
