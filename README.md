# ShareFood · Prototipo funcional

Prototipo académico de **ShareFood**, una aplicación web para redistribuir excedentes de comida de restaurantes, cafeterías y panaderías hacia estudiantes universitarios en condición de vulnerabilidad alimentaria en Manizales.

Acompaña el trabajo de grado *«Reducción del desperdicio de alimentos mediante la redistribución digital de excedentes hacia estudiantes universitarios vulnerables en la ciudad de Manizales: propuesta de diseño de una aplicación web»*, de **Gabriel Sánchez Cristancho**, dirigido por el **Ph.D. Jheimer Julián Sepúlveda López** (Administración de Sistemas Informáticos, Universidad Nacional de Colombia, sede Manizales, 2026).

> Datos ficticios. Todo se guarda únicamente en el navegador de quien abre el prototipo (`localStorage`); no hay servidor ni base de datos.

## Qué se puede hacer

| Rol | Funciones |
|---|---|
| **Estudiante** | Ver donaciones cercanas en lista y mapa, filtrar por tipo y alérgenos, leer la ficha del alimento, reservar con un código de retiro, cancelar, ver avisos, validar la cuenta con su universidad y reportar problemas. |
| **Establecimiento** | Publicar un excedente con ficha y declaración obligatorias, confirmar entregas con el código, simular reservas, cerrar la jornada y consultar el historial. |
| **Coordinación** | Ver indicadores, alertas e incidencias, el registro de trazabilidad (con verificación de integridad y exportación CSV) y editar los parámetros de equidad. |

### Reglas del diseño que están implementadas

- **RN01**: tiempo máximo entre la preparación y el fin de la recogida según el tipo de alimento (valores de demostración).
- **RN02 / RF08**: no se publica sin las tres declaraciones del establecimiento.
- **RN04**: acceso prioritario de 15 minutos para estudiantes con prioridad alta.
- **RN05 / RF14**: la publicación vence sola al terminar la ventana y las reservas pendientes quedan como «No recogida».
- **RN06 / RN07**: una reserva activa a la vez y un cupo de 3 reservas por semana.
- **RN08**: 2 inasistencias en 30 días generan una pausa de 7 días.
- **RN09 / RF11 / RF13**: entrega solo con un código de retiro válido; el establecimiento nunca ve el nombre del estudiante.
- **RN10**: un reporte sanitario suspende la publicación hasta que la coordinación la revise.
- **RF16 / RNF07**: cada evento guarda la huella (hash) del anterior, así que una alteración del historial se detecta.

## Estructura

```
index.html              Página única de la aplicación
manifest.webmanifest    Permite instalarla como aplicación web progresiva
.nojekyll               Evita que GitHub Pages procese los archivos con Jekyll
assets/icon.svg         Ícono
css/styles.css          Estilos (diseño adaptable a celular y computador)
js/app.js               Vistas, navegación y eventos de la interfaz
js/store.js             Estado, datos de ejemplo y reglas de negocio
js/util.js              Utilidades (fechas, hash, escape de HTML)
js/icons.js             Íconos SVG
```

HTML, CSS y JavaScript (módulos ES) sin dependencias ni proceso de compilación.

## Probarlo en tu computador

Los módulos de JavaScript no funcionan abriendo el archivo con doble clic; hace falta un servidor local:

```bash
# Desde la carpeta del proyecto
python -m http.server 8000
# Luego abre http://localhost:8000
```

## Créditos

Diseño e investigación: Gabriel Sánchez Cristancho. Prototipo elaborado con apoyo de Claude (Anthropic, 2026).

Licencia MIT.