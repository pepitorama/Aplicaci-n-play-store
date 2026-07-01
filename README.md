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
- Tres defensas:
  - **Analizador:** rapido y equilibrado.
  - **Firewall:** dano alto contra enemigos resistentes.
  - **Sandbox:** ralentiza amenazas.
- Tres enemigos:
  - **Gusano:** comun.
  - **Spyware:** rapido.
  - **Botnet:** resistente.
- Oleadas con vista previa.
- Economia por energia, upgrades, puntuacion e integridad del nucleo.
- Micro-recompensas tras cada oleada.
- Ajuste de dificultad si la oleada anterior tuvo muchas fugas.
- PWA con manifest, icono y service worker offline.

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
- Teclas `1`, `2`, `3`: cambiar defensa.
- `Espacio`: iniciar oleada.

## Siguientes pasos recomendados

- Balancear costos, dano y velocidad con sesiones de prueba.
- Anadir tutorial interactivo de 30 segundos.
- Guardar progreso local y desbloqueos.
- Convertir en Android con Trusted Web Activity, Capacitor o un proyecto nativo si se decide llevarlo a Play Store.
