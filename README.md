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
