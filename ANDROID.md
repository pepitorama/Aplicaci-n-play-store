# Preparacion Android / Play Store

Este proyecto es una PWA sin dependencias externas. La ruta recomendada para Play Store es:

## Opcion A: Trusted Web Activity

1. Publicar la PWA en HTTPS.
2. Verificar que `manifest.webmanifest` incluya:
   - `name`
   - `short_name`
   - `icons`
   - `screenshots`
   - `start_url`
   - `display: standalone`
3. Crear proyecto Android TWA con Bubblewrap o Android Studio.
4. Configurar Digital Asset Links.
5. Probar offline y navegacion de `help.html` / `privacy.html`.
6. Subir a Play Console como prueba interna.

## Opcion B: Capacitor

1. Crear proyecto Capacitor.
2. Copiar build estatico o apuntar a la PWA.
3. Configurar iconos y splash.
4. Validar almacenamiento local.
5. Generar AAB para Play Console.

## Checklist de publicacion

- [ ] Iconos finales en varios tamanos.
- [ ] Screenshots reales de juego.
- [ ] Politica de privacidad revisada.
- [ ] Texto de ficha Play Store.
- [ ] Prueba offline.
- [ ] Prueba de importar/exportar progreso.
- [ ] Prueba de accesibilidad: contraste, texto grande, movimiento reducido.
