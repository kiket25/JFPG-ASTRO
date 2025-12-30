---
title: "Wargames - Dockerlabs CTF Writeup"
description: "CTF maquina wargames, un reto basado en la pelicula de los años 80 llamada wargames pero en un esceniario actual como es la explotacion de una vulnerabilidad de prompt injection."
pubDate: 2025-08-31
heroImage: "/img/war.png"
---

### Introducción



En este write-up se documenta la explotación de la máquina **
wargames (Dockerlabs)**.  

El objetivo principal de este laboratorio fue practicar técnicas de reconocimiento, análisis de servicios y escalada de privilegios en un entorno controlado con un fuerte componente de lógica y análisis estático.
Durante el proceso se identificó un sistema legacy accesible por red que simulaba un interfaz conversacional, donde una confianza excesiva en la entrada del usuario permitió la explotación de una vulnerabilidad de prompt injection. Posteriormente, mediante el análisis estático de un binario privilegiado, se descubrió una ruta de ejecución oculta que permitió obtener acceso con privilegios elevados.
Este ejercicio refleja escenarios reales en los que sistemas antiguos, configuraciones inseguras y fallos de diseño lógico pueden comprometer completamente un entorno, incluso sin necesidad de vulnerabilidades técnicas complejas


En primer lugar empezamos lanzando un escaneo ping para averiguar si sen trata de un sistema linux o windows en base a su ttl y de si tenemos conectividad con la maquina.

<p align="center">
  <img src="/img/wargames/wg-1.png" alt="ping" width="80%">
</p>

Ahora usando la herramienta de NMAP, la cual nos puede ayudar a saber que puertos hay expuestos en el servidor y que servicios tiene cada uno de ellos.

<p align="center">
  <img src="/img/wargames/wg-2.png" alt="nmap" width="80%">
</p>

Parcer ser que tenemos diferentes de entre los cuales nos llama la atencion el puerto 5000 el cual vamos a revisar primero el puerto 80 mediante web.


Pasaremos a visualizar la pagina web.

<p align="center">
  <img src="/img/wargames/wg-3.png" alt="nmap" width="80%">
</p>

Ahora vemos que nos dice Try more basic connection o es decir de probar algo mas simple como puede ser una session netcat. con nuetra ip del servidor apuntando al puerto 5000.

<p align="center">
  <img src="/img/wargames/wg-4.png" alt="nmap" width="80%">
</p>

