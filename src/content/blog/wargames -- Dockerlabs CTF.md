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
  <img src="/img/wargames/wg-6.png" alt="nmap" width="80%">
</p>


Parece ser que tenemos delante un chatbot el cual es un simular de juegos aunque al ser una chatbot puede tenga una vulnerabilidad de prompt injection.

<p align="center">
  <img src="/img/wargames/wg-7.png" alt="nmap" width="80%">
</p>

Al parecer si que se trata de prompt injection y nos delvolvio los creedenciales de ssh para acceder al servidor usando el user joshua. 

Procedemos a decodificar el cifrado el cual se encuentra en sha256

<p align="center">
  <img src="/img/wargames/wg-8.png" alt="nmap" width="80%">
</p>

A continuacion probamos de acceder mediante ssh y logramos conexion exitosa.

<p align="center">
  <img src="/img/wargames/wg-10.png" alt="nmap" width="80%">
</p>

Buscamos alguna forma de poder escalar privilegios y encotramos un binario con propietario root pero posee permios suid

<p align="center">
  <img src="/img/wargames/wg-11.png" alt="nmap" width="80%">
</p>

Pero ejecutando el binario no logramos acceder

<p align="center">
  <img src="/img/wargames/wg-12.png" alt="nmap" width="80%">
</p>

ya que si nos traemos el binario a nuestra maquina y lo decopilamos podemos ver que hay que introducir una palabra como opcion del binario para poder acceder al una shell.

<p align="center">
  <img src="/img/wargames/wg-9.png" alt="nmap" width="80%">
</p>

Y ahora si despues de descubrir esa clave logramos acceder como root y obtener ganar la partida.

<p align="center">
  <img src="/img/wargames/wg-13.png" alt="nmap" width="80%">
</p>