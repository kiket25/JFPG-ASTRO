---
title: "Lo-FI -- TRYHACKME CTF Walkthrough"
description: "Lo-fi es simple y fantastico reto para iniciarse en la explotacion de un Local File Inclusion LFI o path traversal"
pubDate: 'Apr 26 2024'
heroImage: "../img/lofi.webp"
---

## 🔎 Enumeración

Comenzamos analizando la máquina con **nmap** para descubrir puertos abiertos y servicios activos.

<br>

![Escaneo Nmap](lofi-enum.png)

<br>

Se observan dos puertos:

22/tcp SSH 80/tcp HTTP


<br>

Accedemos a la página web en el puerto 80 y encontramos un sitio sencillo que reproduce música Lo-Fi mediante vídeos de YouTube. Desde la sección **Discography** se puede cambiar entre distintas pistas.

<br>

![Sitio Web](lofi-web.png)

<br>

Utilizando **Burp Suite** para interceptar las peticiones, vemos que el sitio realiza peticiones GET con un parámetro `page` para cambiar el contenido.

<br>

![Burp Suite - Petición Interceptada](lofi-burp1.png)

---

## 🚀 Explotación

La descripción del reto menciona una vulnerabilidad **LFI** (Local File Inclusion).

<br>

![Descripción del reto en TryHackMe](lofi-thm.png)

<br>

Empezamos intentando incluir un archivo clásico en ataques LFI: `/etc/passwd`, sustituyendo el valor de `page`:

<br>

![Intento de LFI inicial](lofi-lfi1.png)

<br>

Sin embargo, la aplicación responde con un error preconfigurado. Para intentar evadir el filtro, aplicamos un bypass utilizando `../` varias veces para forzar una lectura desde el sistema de archivos.

<br>

![Bypass de LFI](lofi-lfi2.png)

<br>

Esta vez conseguimos visualizar correctamente el contenido de `/etc/passwd`, lo que confirma la existencia de LFI.

Ya que el objetivo del reto es encontrar un archivo `flag.txt`, modificamos la carga para intentar acceder a `/flag.txt` directamente:

<br>

![Captura del flag](lofi-flag.png)

---

## 🎯 Conclusiones

**Lo-FI** es una máquina ideal para comenzar a practicar ataques de **Local File Inclusion** y **Path Traversal** de manera sencilla.

Permite comprender los conceptos básicos de explotación de archivos locales en aplicaciones web y cómo utilizar técnicas de bypass cuando existen filtros simples.

---