# Defiende el Nucleo PC

Prototipo jugable de una aplicacion tipo **tower defense + simulacion de seguridad en PC**. La idea es que el jugador proteja el CPU/Nucleo de oleadas de malware colocando defensas como analizadores, firewalls y sandboxes.

El proyecto esta hecho como PWA sin dependencias externas para poder probarse rapido en PC y servir como base para empaquetarlo mas adelante hacia Play Store con un wrapper Android/TWA o un stack movil.

## Investigacion rapida aplicada

### Que suelen llevar los juegos tipo "defiende tu torre"

La investigacion de juegos tower defense muestra patrones estables:

- **Ruta clara de enemigos:** el jugador entiende por donde avanzan las amenazas antes de gastar recursos.
- **Torres automaticas:** se colocan una vez y luego atacan por rango, prioridad y velocidad.
- **Economia ajustada:** matar enemigos da dinero, y cada decision compite contra otra: torre nueva, upgrade o ahorro.
- **Oleadas con preview:** mostrar la composicion de la siguiente oleada reduce frustracion y permite planear.
- **Tipos de enemigos:** rapidos, resistentes y comunes obligan a combinar torres.
- **Sinergias y upgrades:** mantener decisiones vivas durante toda la partida aumenta profundidad.
- **Meta de sesiones cortas:** recompensas tras oleadas y reinicio rapido ayudan a retencion.

Fuentes consultadas:

- PhyFun, "Tower Defense Games: A Deep Dive".
- StrategyGame.org, "What Is a Tower Defense Game? Mechanics + History".
- Game Developer, "Tower Defense Game Rules".
- TekRevol, "How to Build a Mobile Strategy Game".

### Como captar atencion sin saturar al jugador

Estudios sobre atencion, flow y gamificacion sugieren:

- **Flow:** la atencion sube cuando dificultad y habilidad estan equilibradas. Por eso el prototipo ajusta suavemente la siguiente oleada si hubo muchas fugas.
- **Carga cognitiva baja:** ruta, HUD y preview reducen informacion innecesaria.
- **Feedback inmediato:** disparos, barras de vida, mensajes y recompensas cierran el ciclo accion-respuesta.
- **Recompensas breves:** micro-recompensas tras oleadas elevan motivacion sin cortar demasiado la partida.
- **Control simple:** click para colocar/mejorar y teclas 1, 2, 3 + espacio para que la interaccion sea facil.

Fuentes consultadas:

- Frontiers in Psychology (2023), "Influence of game features on attention in adults".
- European Journal of Neuroscience (2025), "Shielding the Mind With Flow".
- Cognitive, Affective, & Behavioral Neuroscience (2018), "Does intrinsic reward motivate cognitive control?".
- JMIR Serious Games (2020), "Effective Gamification of the Stop-Signal Task".

## Funciones implementadas

- Tablero canvas 14x9 con ruta visible.
- Tutorial inicial de tres pasos para reducir friccion en la primera partida.
- Dificultad seleccionable: facil, normal y dificil.
- Pantalla inicial con accesos a jugar, tutorial y progreso.
- Modo de alto contraste, texto grande y movimiento reducido para accesibilidad.
- Campana de 5 etapas con objetivos por mapa/dificultad.
- Tutorial guiado por acciones reales: colocar, iniciar, mejorar, cambiar prioridad y vender.
- Panel de estrategia por mapa con torres recomendadas, amenazas esperadas y consejos.
- Recursos de PC simulados: CPU, RAM, Disco y Red.
- Eventos de sistema: pico de trafico, actualizacion critica y escaneo de disco.
- Investigacion permanente con puntos ganados por partida.
- Modo practica sin afectar records, campana ni estadisticas.
- Editor simple de oleadas para modo practica.
- Herramientas de practica: +100 energia, danar nucleo, limpiar enemigos y desbloquear torres temporalmente.
- Desafio diario local determinista por fecha.
- Panel de analisis por mapa: records, oleada maxima, derrotas, fugas y torres usadas.
- Sugerencias automaticas de balance basadas en metricas locales.
- Modo daltónico: paletas protanopia y deuteranopia.
- Tooltips en tarjetas de mapa, dificultad y defensas.
- Mejoras visuales de combate: auras de torres, alerta de Exploit cercano y borde de recurso critico.
- Renderer optimizado con cache de fondo/ruta y limite de efectos simultaneos.
- Gestion de foco y cierre con `Escape` en modales.
- Guardado robusto con version de perfil, validacion de importacion, backup y reset de progreso.
- Panel de fin de partida "por que perdiste" con amenaza filtrada, recurso bajo y derrotas por mapa.
- Metricas locales de balance sin servidor: fugas por enemigo, torres usadas, derrotas por mapa y recurso mas bajo.
- Selector de mapas con modificadores de recompensa, velocidad, oleadas y energia:
  - Nucleo clasico
  - Circuito largo
  - Cache angular
  - Linea dura
  - Espiral del nucleo
  - Parche rapido
  - Bus experto
- Ocho defensas:
  - **Analizador:** rapido y equilibrado.
  - **Firewall:** dano alto contra enemigos resistentes.
  - **Sandbox:** ralentiza amenazas.
  - **IA Centinela:** se desbloquea con progreso o con recompensa de plano.
  - **Antivirus:** dano constante.
  - **Detector:** aumenta rango de torres cercanas.
  - **Trampa:** dano de area.
  - **Servidor espejo:** ralentiza amenazas cercanas.
- Ocho enemigos:
  - **Gusano:** comun.
  - **Spyware:** rapido.
  - **Botnet:** resistente.
  - **Ransomware:** amenaza lenta y resistente de oleadas superiores.
  - **Troyano:** amenaza media.
  - **Rootkit:** resistente al dano basico.
  - **DDoS:** amenaza pequena y veloz.
  - **Exploit:** si llega al nucleo quita mas integridad.
- Oleadas con vista previa.
- Barra de progreso de oleada.
- Pausa y velocidad de simulacion x1/x2/x3 para probar estrategias en PC.
- Prioridad de objetivo por torre: primero, fuerte, rapido o debil.
- Venta de torres con devolucion parcial de energia.
- Misiones y logros locales para aumentar rejugabilidad.
- Pantalla de fin de simulacion con resumen de partida.
- Exportar/importar progreso en JSON.
- Economia por energia, upgrades, puntuacion e integridad del nucleo.
- Micro-recompensas tras cada oleada.
- Ajuste de dificultad si la oleada anterior tuvo muchas fugas.
- Guardado local de record, maxima oleada, estadisticas por mapa, partidas jugadas, dificultad y desbloqueos.
- Records por dificultad, mejor racha perfecta y progreso de campana.
- Sonidos sinteticos ligeros con opcion de silencio.
- Feedback visual de rango, impactos, derrotas y alertas del nucleo.
- PWA con manifest, icono y service worker offline.
- Manifest PWA con screenshots placeholder y acceso directo "Jugar" para preparacion Play Store/TWA.
- Paginas `help.html` y `privacy.html` cacheadas offline.
- Documentacion `ANDROID.md` y `TESTING.md`.
- `offline.html` y `CHANGELOG.md` para preparacion PWA/publicacion.

## Estructura

```text
src/
  audio.js       Sonidos sinteticos y mute.
  config/        Configuracion de dificultad y curvas de balance.
  gameLogic.js   Motor: oleadas, torres, enemigos, economia y dificultad.
  main.js        Coordinador entre UI, motor, render, audio y persistencia.
  maps.js        Definiciones de mapas y rutas.
  campaign.js    Etapas de campana y evaluacion de avance.
  progression.js Misiones, logros y evaluacion de progreso.
  renderer.js    Dibujo del canvas y efectos visuales.
  storage.js     Perfil local con localStorage.
  ui.js          HUD, tutorial, recompensas, dificultad y tarjetas.
  styles.css     Estilos responsive de la PWA.
```

## Ejecutar

```bash
npm start
```

Despues abre:

```text
http://localhost:4173
```

## Probar

```bash
npm test
```

## Controles

- Click en casilla libre: colocar defensa seleccionada.
- Click en torre existente: mejorar si hay energia.
- `Shift` + click en torre: cambiar prioridad de objetivo.
- Teclas numericas: cambiar defensa si esta desbloqueada.
- `Espacio`: iniciar oleada.
- `P`: pausar/reanudar.
- `F`: cambiar velocidad x1/x2/x3.
- `T`: cambiar prioridad de la torre seleccionada.
- Boton vender: vende la torre seleccionada.
- Boton de sonido: activar/desactivar efectos.
- Boton contraste: activa/desactiva alto contraste.
- Boton movimiento: reduce animaciones.
- Boton texto: aumenta tamano de texto.
- Boton practica: activa/desactiva modo sin records.
- Boton resetear progreso: crea backup local y reinicia perfil.
- Boton color: rota paleta normal/protanopia/deuteranopia.
- Escape: cierra modales abiertos.

## Siguientes pasos recomendados

- Balancear costos, dano y velocidad con sesiones de prueba reales.
- Anadir mas mapas en `src/maps.js` sin tocar el motor principal.
- Anadir nuevas misiones/logros en `src/progression.js`.
- Convertir en Android con Trusted Web Activity, Capacitor o un proyecto nativo si se decide llevarlo a Play Store.
