# GUÍA DEL PROYECTO · Real Life Simulator

## Cómo se usa esta guía

1. Abre un chat **nuevo** en Claude y escribe tu idea: «Hola Claude, quiero hacer esto: … Toma la guía». Pega o adjunta este fichero.
2. Claude te explicará cómo lo haría y te dirá **qué ficheros** necesita. Descárgalos de GitHub y adjúntaselos.
3. Claude te devolverá los ficheros **enteros**. En GitHub, abre cada fichero, pulsa el lápiz, selecciónalo todo, pega lo nuevo y guarda («Commit changes»).
4. Espera a que Render publique el juego y pruébalo.
5. Si sale el **cartel rojo**, pulsa «Copiar error», pégalo en el mismo chat y Claude lo arreglará.

Usa **una idea por chat**. Cuando termines, abre un chat nuevo para la siguiente idea.

---

## INSTRUCCIONES PARA CLAUDE

Estás ayudando a un chaval que no programa a hacer su juego. Usa el plan gratuito, así que **ahorra**: no repitas código que no cambia, no expliques de más y no pidas ficheros que no necesitas.

### Cómo trabajar

1. **Primero, el plan (sin código).** Explica en 3-6 frases sencillas cómo harás la idea y pide **solo** los ficheros que necesitas, con su nombre exacto, de la lista de abajo. Máximo 3. Si la idea es muy grande, divídela en pasos y haz solo el primero.
2. **Nunca te inventes cómo es un fichero que no tienes.** Si te hace falta otro, pídelo.
3. **Devuelve cada fichero modificado ENTERO**, en un solo bloque de código, con su nombre encima (por ejemplo `js/tiendas-negocios.js`). Nunca devuelvas trozos ni «pega esto en la línea X».
4. **Antes de entregar, revisa:**
   - que todas las llaves `{}`, paréntesis `()` y comillas están cerradas;
   - que cada función o variable que usas existe (en los ficheros que te han pasado o en «Herramientas comunes»);
   - que no has borrado ni cambiado nada que no tenía que ver con la idea.
5. **Termina diciendo:** qué ficheros hay que sustituir, y cómo probarlo (a dónde ir en el juego, qué pulsar y qué debería ver).
6. **Si te pegan un error del cartel rojo**, viene con el fichero y la línea. Arréglalo y devuelve el fichero entero otra vez.
7. **Si creas un fichero nuevo o cambias de qué se encarga uno, devuelve también este `GUIA.md` actualizado** (y actualiza la FICHA del principio del fichero).
8. Si tras tu cambio un fichero pasa de **45 KB**, avísalo y propón dividirlo en dos. Si no, Claude gratis no podrá devolverlo entero.
9. Mantén el estilo del fichero (compacto, comentarios en castellano). Todos los textos del juego van en castellano.

### Reglas del proyecto (importante)

- **Todos los ficheros de `js/` comparten las mismas variables.** Se cargan en el orden de la lista de `<script>` de `index.html`. **No cambies ese orden.**
- **La semilla del mapa.** El mundo se construye con números aleatorios de semilla fija (`rnd()`, `pick()`, `rr()`), y las casas se numeran según se crean (las partidas guardadas usan esos números). Por eso:
  - En cosas nuevas del mapa **usa números fijos**, no `rnd()`, `pick()` ni `rr()`. Usarlos movería todo lo que se construye después.
  - No uses `Math.random()` para colocar cosas del mapa: cada jugador vería un mundo distinto.
  - Si de verdad necesitas aleatorio, guarda y restaura la semilla, como hace `factory()`: `const sd0=seed; … seed=sd0`.
  - No crees casas (`HOUSES`) nuevas en medio de las que ya existen.
- **Funciones entre ficheros.** Si algo se ejecuta **mientras se carga el mapa** (no dentro de una E, un clic o un fotograma), solo puede usar funciones del **mismo fichero o de uno anterior**. Las funciones que se usan al pulsar E, al hacer clic o en el bucle pueden estar en cualquier fichero.
- **Objetos con E (sin tocar la tecla E).** Para que la E haga algo nuevo, en el mismo fichero donde construyes la cosa:
  ```js
  const mostrador=box(100,0,50,2,1,1,0x8b5a2b,true); // x, y, z, ancho, alto, fondo, color, ¿choca?
  IA(mostrador,'pizzeria');                          // apúntalo como objeto con E
  IDEF.pizzeria={txt:o=>'E: pedir una pizza',act:o=>{openDlg();dlg.innerHTML='<h2>🍕 Pizzería</h2>…'}};
  ```
  `IA` está en `edificios.js`, así que úsalo en `edificios.js` o en un fichero posterior. **No hace falta tocar `interaccion-mapa-clima.js`.**
- **Guardar la partida:** `money`, `inv` (inventario) y `flags` ya se guardan solos. Para guardar algo nuevo, ponlo dentro de `flags` (por ejemplo `flags.pizzas=3`).
- **Cosas que ven todos los jugadores** (compartidas en el mundo) necesitan también `server.js`.
- Cada fichero empieza con `'use strict';` (menos `pantalla-tactil.js`). No lo quites.

---

## Ficheros

| Fichero | Qué hay | Tócalo si quieres… |
|---|---|---|
| `index.html` | CSS (aspecto de HUD, ventanas, chat…), HTML (HUD, pantalla de inicio) y el cartel rojo de errores | cambiar colores o el aspecto de los menús, añadir algo al HUD |
| `js/mundo-base.js` | configuración, terreno, escena 3D, `box`, `mat`, `rnd`, personajes (incluye peinados: `outfitOpts`, `person`, `refreshLook`) y coches (modelos, tráfico) | cambiar personajes, peinados o coches, añadir un modelo de coche |
| `js/edificios.js` | edificios y comercios del barrio principal, `SHOPS` (datos de cada tienda), `IA`, fábricas, ropa, peluquería (menú de peinados, 4.3) | añadir un tipo de tienda, cambiar edificios o interiores, la peluquería |
| `js/ciudad.js` | calles, manzanas, dónde va cada comercio, señales y semáforos | cambiar calles o dónde está cada tienda |
| `js/afueras.js` | biblioteca, universidad, aeropuerto y hospital (los edificios) | cambiar esos edificios |
| `js/puerto.js` | puerto, barcos, navegar y pesca | barcos, pesca, lonja |
| `js/transporte.js` | montaña y mirador, coches aparcados, locales en venta, pisos, isla pequeña, autobuses, aviones y avionetas | autobuses, aviones, avionetas, isla pequeña |
| `js/isla-grande-metro.js` | isla grande, terrenos (parcelas) y metro | isla grande, metro |
| `js/helicopteros.js` | helicópteros | helicópteros |
| `js/tiendas-negocios.js` | jugador (`money`, `pl`, `inv`, `flags`), avisos, ventanas, hablar con dependientes (`talk`), taller, comprar, negocios propios, admin, habilidades, horarios (`HRS`), dormir | tiendas, precios, horarios, negocios, habilidades, admin |
| `js/banco-casas.js` | banco y préstamos, comprar/alquilar/hipotecar casas, inmobiliaria con mapa, hotel, sentarse | banco, casas, inmobiliaria |
| `js/estudios-gimnasio.js` | minijuegos de biblioteca y gimnasio, universidad, comida basura, lista `IDEF` (objetos con E) | minijuegos, universidad, gimnasio |
| `js/servicios-trabajos-fisica.js` | gasolina, hotel, ascensores, trabajos (`jobMenu`), teclas, física del jugador | trabajos, teclas, cómo se mueve el jugador |
| `js/construccion.js` | construir por módulos en los terrenos | piezas o editor de construcción |
| `js/interaccion-mapa-clima.js` | tecla E por dentro, cámara, minimapa, rutas, día/noche y clima | cámara, mapa, clima |
| `js/multijugador.js` | conexión, chat, mensajes privados, transferencias, cuentas, llaves | chat, transferencias, cuentas (casi siempre con `server.js`) |
| `js/bucle-mascotas-gobierno.js` | bucle principal (cada fotograma), mascotas, gobierno y elecciones, propiedades de otros jugadores | mascotas, gobierno, algo que pase en cada fotograma |
| `js/guardado-sonido-movil.js` | guardar y cargar partida, sonidos y radio, móvil del jugador dentro del juego, arranque | sonidos, apps del móvil del juego, guardado |
| `js/pantalla-tactil.js` | joystick y botones para móvil, ajustes de pantalla | controles de móvil |
| `server.js` | servidor: cuentas, partidas, chat, hora y clima compartidos, negocios, casas de terrenos, elecciones… | cualquier cosa compartida entre jugadores |

## Recetas: qué ficheros pedir

| Si quieres… | Pide |
|---|---|
| un objeto nuevo con E en un sitio que ya existe | el fichero donde está ese sitio |
| un edificio o lugar nuevo en el mapa | el fichero de la zona (`edificios.js`, `afueras.js`, `isla-grande-metro.js`…) |
| un producto o precio nuevo en una tienda | `edificios.js` (`SHOPS`) |
| un **tipo** de tienda nuevo (como la hamburguesería) | `edificios.js` + `ciudad.js` + `tiendas-negocios.js` |
| un trabajo básico nuevo en una tienda | `edificios.js` (`job` en `SHOPS`) + `tiendas-negocios.js` (habilidades que pide) |
| un trabajo con minijuego (como repartidor o taxista) | `servicios-trabajos-fisica.js` + `tiendas-negocios.js` |
| un vehículo nuevo | `mundo-base.js` (+ `tiendas-negocios.js` si se vende) |
| un minijuego nuevo | el fichero del sitio donde se juega |
| una app nueva en el móvil del juego | `guardado-sonido-movil.js` |
| algo en el chat o entre jugadores | `multijugador.js` + `server.js` |
| cambiar colores o el aspecto de menús | `index.html` |

## Herramientas comunes (se pueden usar desde cualquier fichero)

| Qué | Para qué | Dónde está |
|---|---|---|
| `box(x,y,z,ancho,alto,fondo,color,choca)` | poner una caja 3D (paredes, muebles…) | mundo-base.js |
| `mat(color)` | material de un color | mundo-base.js |
| `person(colorCamiseta)` | crear un personaje 3D | mundo-base.js |
| `IA(malla,'tipo')` + `IDEF.tipo={txt,act}` | objeto con E | edificios.js / mundo-base.js |
| `SHOPS` | datos de cada tienda (nombre, colores, productos) | edificios.js |
| `toast('texto')` | aviso corto en pantalla | tiendas-negocios.js |
| `openDlg()`, `dlg.innerHTML=…`, `closeDlg()` | abrir, rellenar y cerrar una ventana | tiendas-negocios.js |
| `money`, `inv`, `flags` | dinero, inventario y progreso (se guardan solos) | tiendas-negocios.js |
| `pl.x`, `pl.z` | posición del jugador | tiendas-negocios.js |
| `addSkill('clave',puntos)` | subir una habilidad | tiendas-negocios.js |
| `isOpen('clave')`, `hrsTxt('clave')`, `HRS` | horarios de las tiendas | tiendas-negocios.js |
| `fade('texto',función)` | fundido a negro (pasar tiempo) | tiendas-negocios.js |
| `sfx.cash()`, `sfx.door()`… | sonidos | guardado-sonido-movil.js |
| `saveGame()` | guardar la partida ahora | guardado-sonido-movil.js |
| `$('id')` | coger un elemento del HTML | mundo-base.js |
| `refreshLook()` | rehacer el modelo 3D del jugador tras cambiar `flags.look` (peinado: `{hs:estilo,hc:color}`) | mundo-base.js |

## Ejemplo real: la hamburguesería

Se hizo así (sirve de modelo para cualquier tipo de tienda nueva):
- `edificios.js`: `SHOPS.burger` con el nombre, los colores, el icono 🍔, los productos y el trabajo (`job:['Cocinero de comida rápida',120]`).
- `ciudad.js`: en qué locales del barrio aparece (`BURGER_AT`).
- `tiendas-negocios.js`: horario en `HRS` (`burger:[11,24]`) y las habilidades que pide el trabajo de cocinero.
- `estudios-gimnasio.js`: la comida basura que resta Condición Física.

## Ejemplo real: la peluquería

- `edificios.js`: `SHOPS.hair`, su interior `hairIn` (sillones con `IA(...,'hairchair')`) y el menú `hairMenu` con `IDEF.hairchair`. El horario `HRS.hair` se añade desde ahí al terminar de cargar (pendiente de moverlo a `tiendas-negocios.js`).
- `ciudad.js`: la 2.ª tienda de moda del barrio (`petT`) es la peluquería.
- `mundo-base.js`: `outfitOpts()` lee `flags.look` y `person()` dibuja los peinados (`hs`: short, buzz, long, ponytail, bun, afro, mohawk, bald).
