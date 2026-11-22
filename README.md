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

## Registros diarios y calculadora independiente

La sección **03 · Precintos y sal** reúne el cálculo de insumos fuera de Descarga Fresco. Permite introducir peso total kg o copiarlo de una descarga actual o guardada. Copia proveedor, fecha, presentación y peso como una instantánea: cambios posteriores de la descarga no alteran el cálculo. Conserva el cálculo anterior de Fresco al actualizar la aplicación.

Los sacos recibidos son la cantidad realmente enviada por el proveedor, independiente de los sacos de sal calculados. Fresco cuenta con un campo explícito de sacos recibidos. La calculadora informa kg de sal (`peso × 0.012`), sacos de sal equivalentes y sacos completos para disponer (redondeo superior), además del correlativo inclusivo de precintos.

**Guardar registro del día** conserva una copia. **Guardar y empezar otro** guarda antes de limpiar y abre un borrador con fecha actual. Repetir el guardado sin cambios no duplica el registro; editar una copia y guardarla crea una nueva versión y conserva la anterior. Si falla el guardado por falta de espacio, no se limpia el registro.

**Registros diarios** filtra por fecha, proveedor y sección; permite abrir copias y exportar cada registro a CSV. Los registros permanecen entre días y reinicios en el mismo navegador y origen. No se sincronizan entre dispositivos: borrar los datos del navegador puede eliminarlos. Descargar un respaldo JSON conserva los registros guardados fuera del navegador; restaurarlo añade registros sin reemplazar los existentes y evita duplicados de contenido. CSV/Excel/PDF siguen disponibles por sección.

Validación: pruebas en Chromium de guardar/nuevo sin duplicar, apertura de copia inmutable, filtros, persistencia tras recarga, recuperación de datos previos, cálculo independiente y fórmulas, CSV/PDF, restauración de respaldos en un navegador nuevo y diseño a 320/390/768/1440 px.

## Corrección de recuperación y edición

Registros diarios muestra los borradores con guardado automático además de los registros archivados. «Buscar registros anteriores en este navegador» revisa las claves locales de la aplicación y sus copias de recuperación, y añade los registros encontrados sin reemplazar los existentes. La carga acepta bases anteriores aunque falten listas como exports. Conserva una última copia válida y una instantánea anterior al primer cambio de cada día; un JSON principal dañado puede recuperarse de la última copia local válida. Los respaldos JSON ahora incluyen los tres borradores y el archivo diario.

Esto recupera datos que todavía existen en ese navegador/origen; no puede obtener datos de otro dispositivo, de otro navegador o eliminados sin respaldo. No se agregan registros históricos inventados.

Las cantidades referenciales admiten borrar y volver a escribir, con decimales, sin restaurar el valor anterior durante la escritura. La conversión TON/KG conserva hasta 15 dígitos significativos sin truncar a tres decimales. Los pesos del saco del proveedor y de los sacos de sal son números positivos editables, sin una lista cerrada. La cantidad de sacos recibidos es independiente. Para presentaciones de producto distintas de las estándar, Salado permite elegir explícitamente una de las dos tablas de muestreo disponibles. Las importaciones también aceptan pesos de saco personalizados.

## Cálculos de planta vinculados y datos de prueba Fresco

La sección 03 se llama **Cálculos de planta**, con un registro ampliable de paneles en `modules/calculos-planta.js`. Incluye las fórmulas actuales de precintos y sal; no se agregan fórmulas futuras sin definición.

Cada descarga tiene «Calcular con esta descarga». El modo vinculado mantiene peso neto, proveedor, fecha y presentación sincronizados con el borrador de Fresco o Salado elegido. Al guardar y empezar otra descarga, el vínculo se fija al registro archivado para no cambiar el cálculo anterior por un peso vacío. También pueden vincularse registros ya guardados.

**Ingreso manual** permite editar libremente peso, proveedor, fecha y presentación; cambiar una descarga no altera los valores manuales. Los cálculos guardados se abren con sus valores históricos, sin actualizarse silenciosamente desde un borrador actual. Origen y modo constan en exportaciones y PDF.

Fresco incorpora **Cargar datos de prueba**: proveedor identificado como ejemplo, 3 dinos con taras variables, 90 bandejas, 2250 kg netos y estados mixtos. Son datos ilustrativos, no una transcripción de un registro real. El registro actual se archiva antes de cargar el ejemplo.

Validación Chromium: ejemplo Fresco, conservación del registro previo, sincronización al editar Fresco/Salado, modo manual independiente, persistencia, vínculo fijado al abrir otra descarga, valores históricos inmutables, CSV/PDF y anchos 320/390/768/1440 px sin errores JavaScript.

## Precintos por sacos y estimado referencial

Dentro de Cálculos de planta se elige el método de precintos:

- **Por cantidad real de sacos:** 1 precinto por saco. La cantidad se vincula al total de sacos de Salado o al campo de sacos recibidos de Fresco; también admite ingreso manual.
- **Por peso neto pesado:** se mantiene el cálculo anterior `ceil(neto kg / peso saco)`.
- **Por peso referencial:** `ceil(referencia kg / peso saco)`, con conversión TON/KG. La tarjeta de precintos referenciales siempre muestra este estimado por separado.

El correlativo inclusivo usa el método seleccionado. La sal continúa calculándose con el peso neto/manual del producto, independientemente del método de precintos.

## Rumas de 120 cajas

Nueva herramienta dentro de Cálculos de planta. Ingresa el lote completo como texto numérico (conserva ceros), cajas y observación; permite editar, eliminar y reordenar los lotes. Extrae la referencia `3 primeros-4 últimos` y distribuye las cajas en orden en rumas de capacidad fija 120. Un lote puede repartirse entre varias rumas; se muestra el intervalo de cajas usado, saldo del lote y cajas que faltan tras cada aporte.

Ubicaciones confirmadas por el usuario: primer lote **Abajo**, intermedios **Medio**, el que completa **Arriba**; el último tramo de la ruma incompleta **Último**. Si un solo lote ocupa la ruma completa, aparece **Abajo / Arriba**. La ruma final conserva la cantidad real y muestra cuántas cajas faltan para 120.

«Cargar datos de la imagen» incluye los 15 lotes y cantidades transcritos de la hoja compartida (2100 cajas): 17 rumas completas y una última con 60 cajas, faltando otras 60. El ejemplo se identifica como transcripción a revisar. Se archiva el trabajo anterior antes de cargarlo.

Las rumas tienen borrador independiente, registros diarios, respaldo/restauración y CSV/Excel/PDF, incluyendo todas las asignaciones y saldos. Los cálculos anteriores y las descargas se conservan.

Pruebas de fórmulas y conservación: `node --test tests/calculos.test.mjs`. Verificación de navegador con Chromium: métodos de precintos, vínculo de cantidades y referencia, ingreso manual, sucesión de imagen, edición/orden, guardado, recarga, historial, respaldo/restauración, CSV/PDF y pantallas 320/390/768/1440 px.
