# Sistema de Control y Cálculos de Planta

Aplicación estática modular, táctil y responsiva. Sin dependencias externas.

## Ejecutar

Desde la carpeta del proyecto: `python -m http.server 8000` y abrir `http://localhost:8000`.
También puede servirse en GitHub Pages. Los módulos ES requieren un servidor HTTP.

## Funciones

- Descarga en sacos (Salado), conversión TON/KG y muestreo por tipo de saco.
- Pesadas editables, netos, totales y precintos con ceros iniciales y final manual.
- Guardado automático del borrador e historial local de descargas y exportaciones.
- CSV UTF-8 con BOM y separador `;`, Excel compatible (.xls basado en HTML) e impresión/PDF.
- Registro de módulos en `app.js` para incorporar nuevas secciones.

Los datos quedan en LocalStorage del navegador y origen actuales. Exportar para conservar respaldo. Excel puede advertir que el archivo .xls contiene una tabla HTML. Al importar CSV, definir las columnas de precintos como texto para conservar ceros iniciales.

## Hoja ISMAEL

Reproduce la imagen del 09/11/2026: 7 TON, saco de 23.7 kg, inicio 017121 y ocho filas:

| Bruto kg | Parihuela kg | Sacos | Neto kg | Observación |
|---|---|---|---|---|
|805.5|20|40|785.5||
|784|20|40|764||
|800|20|40|780||
|791|20|40|771||
|796|20|40|776||
|805.5|20|40|785.5||
|635.5|20|31|615.5||
|174.5|20|8|154.5|Sacos para muestreo|

Totales: 8 parihuelas, 279 sacos y 5432 kg. La fila de muestreo está incluida, como en la imagen, y su subtotal se muestra por separado. Muestreo recomendado: 8 sacos.

La fórmula exacta `ceil(5432 / 23.7)` da 230 precintos; el rango inclusivo automático termina en 017350. La imagen indica 017402, conservado como final manual del ejemplo. Sin pesadas, el estimado usa 7000 kg: 296 precintos. El control «Restablecer automático» vuelve al cálculo por peso real.

## Sección 2: Descarga Fresco (Dinos)

- Cabecera independiente: proveedor, fecha, referencia TON/KG, destino 23.7/25/50 kg, otros y estado general del lote.
- Filas con bandejas, bruto, tara variable, estado individual y observaciones. Neto = bruto − tara; la tara no admite valores que produzcan neto negativo. Los totales separan producto en línea y pendiente.
- El estado general se propone a los nuevos dinos. Cambiarlo conserva los estados individuales ya registrados.
- Precintos: `ceil(peso / tipo de saco)`; final inclusivo con ceros iniciales y edición manual.
- Sal: `peso × 0.012` kg. Equivalente en sacos de sal = kg de sal / 25 o / 50; se muestra fraccionario, sin redondear a sacos enteros.
- El peso automático usa todo el neto pesado, incluido pendiente. El modo manual permite simular sin alterar las filas ni sus totales. El modo y peso de cálculo quedan identificados en CSV, Excel y PDF.
- Borradores independientes para Salado y Fresco, historial compartido con apertura de copias y exportaciones por sección. Se mantiene la clave de LocalStorage anterior para conservar los datos existentes.

## Mejoras en Salado

El saco de 25 kg aplica los mismos umbrales de muestreo de 23.7 kg. Cada fila permite editar bruto, parihuela, sacos, cantidad otros y observación. Cantidad otros tiene subtotal propio y no modifica el peso neto ni la cantidad de sacos. Se incluye en CSV, Excel e impresión/PDF. Las filas antiguas reciben cantidad otros = 0 sin perder sus valores.

## Validación de la actualización

Verificado con Chromium/Playwright: recuperación de datos de la versión anterior, edición de bruto/tara/sacos/otros y bandejas, muestreo de 25 kg, estados generales e individuales, netos por estado, conversión TON/KG, precintos inclusivos y manuales, sal a 0.012 y sacos de 25/50 kg, simulación manual, persistencia, historial por sección, CSV/Excel, PDF A4 y anchos 320/390/768/1440 px. Sin errores JavaScript en los flujos verificados.
