Estándares para la Gestión de GitHub con Jira

1. Introducción
El presente documento establece la convención de nombres obligatoria para todos los Pull
Requests (PRs) creados en nuestro repositorio de código.
Adoptar un estándar en los nombres de los PRs es fundamental para mejorar la claridad,
trazabilidad y optimización del flujo de trabajo basado en el estándar Git Flow. El
cumplimiento de éste documento ayudará a la revisión de código de manera más eficiente y
a una mejor comprensión del historial de cambios del proyecto.



2. Principios Generales
Claridad : Los nombres de los PRs deben ser lo más claros posible, transmitiendo
de manera efectiva el propósito principal de los cambios incluidos.
Información Relevante: Incluir información clave que permita a los miembros del
equipo entender el contexto del PR sin necesidad de examinar el código de
inmediato.
Consistencia: Seguir estrictamente el formato definido en este documento para
asegurar la uniformidad en todos los PRs.
Responsablle:
GUSTAVO BIOTT
Elaborado por:
MAURICIO BIOTT
Tipo:
DOCUMENTACION
Fecha:
2/Jun/2025
Estandares - Gestión Github-Jira



3. Definición de los Tipos de Rama Git Flow (<Tipo Git Flow>) de Rama
feature: Utilizar para Pull Requests que introducen nuevas funcionalidades o
mejoras en el código base. Estos PRs generalmente se dirigen a la rama develop.
bugfix: Utilizar para Pull Requests que corrigen errores no críticos identificados
durante el desarrollo. Estos PRs suelen originarse y fusionarse con la rama
develop.
hotfix: Utilizar para Pull Requests que corrigen errores críticos en la rama main (o
producción). Estos PRs se crean desde main, se fusionan de vuelta a main y
también a develop.
release: Utilizar para Pull Requests que preparan una nueva versión para su
lanzamiento. Actualmente, estos PRs se dirigen directamente a la rama main
desde develop.
Responsablle:
GUSTAVO BIOTT
Elaborado por:
MAURICIO BIOTT
Tipo:
DOCUMENTACION
Fecha:
2/Jun/2025
Estandares - Gestión Github-Jira


4. Estándares para Nombres de Ramas (Git Flow)
Para mantener un flujo de trabajo ordenado y facilitar la trazabilidad, los nombres de
las ramas deben seguir la convención: <Tipo de
Rama>/<JIRA-ID>-<descripcion-corta>
Usar siempre minúsculas y guiones para separar palabras en la descripción.
Incluir el identificador de Jira al inicio, inmediatamente después del tipo de rama.
La descripción debe ser breve, sin repetir lo que ya está en el ticket.
Ejemplos
feature/SP25-456-buscador-productos
bugfix/SP25-789-fix-imagenes-galeria
hotfix/DO-1012-rendimiento-api
release/2025-10-02-integracion-bh
release/v1.0



5. Estándares para Mensajes de Commits (Formato con Prefijos)
Los mensajes de commits deben ser claros, concisos y consistentes. <Tipo>:
<mensaje en minúsculas y en infinitivo>
Tipo Uso
feat Para una nueva funcionalidad
fix Para una corrección de bug o error en producción o desarrollo
refactor Para cambios de código que no agregan funcionalidad ni corrigen
bugs
Responsablle:
GUSTAVO BIOTT
Elaborado por:
MAURICIO BIOTT
Tipo:
DOCUMENTACION
Fecha:
2/Jun/2025
Estandares - Gestión Github-Jira
Tipo Uso
chore Para tareas menores o mantenimiento, como cambios en scripts, configs
docs Para cambios en documentación
style Para cambios de formato, sin afectar la lógica (espacios, punto y coma)
test Para agregar o modificar tests unitarios o de integración
ci Para cambios en los archivos de integración continua / pipelines
perf Para mejoras de performance
build Para cambios relacionados a herramientas de build o dependencias
revert Para indicar la reversión de un commit anterior

Ejemplos
feat: agregar buscador de productos en la home
fix: corregir error de visualización en la galería
refactor: simplificar lógica del renderizado
style: aplicar formato a archivo de helpers
chore: actualizar dependencias de proyecto
docs: mejorar guía de instalación en el readme
test: agregar tests para el componente login
ci: modificar job de despliegue a staging
perf: optimizar carga de imágenes en galería
build: agregar script de build para entorno dev
Responsablle:
GUSTAVO BIOTT
Elaborado por:
MAURICIO BIOTT
Tipo:
DOCUMENTACION
Fecha:
2/Jun/2025
Estandares - Gestión Github-Jira
revert: revertir cambios de la PR anterior



6. Estructura del Nombre del Pull Request
El nombre de cada Pull Request deberá seguir la siguiente estructura:
<Tipo de Rama Git Flow>(<JIRA-ID>): <Título Descriptivo>

6.1. Integración con Jira ((<JIRA-ID>))
Obligatorio: Cada Pull Request debe incluir el número del ticket de Jira asociado
entre paréntesis. Por ejemplo: (SP25-123).
Unicidad: Se recomienda que cada Pull Request esté asociado a un único ticket de
Jira para facilitar la trazabilidad y el seguimiento del progreso. En casos donde un
PR aborda múltiples tickets estrechamente relacionados, se debe incluir el ticket
principal y mencionar los otros en la descripción del PR.
Visibilidad: La inclusión del número de Jira permite una vinculación directa entre los
cambios de código y la gestión de tareas.

6.2. Título Descriptivo (<Título Descriptivo>)
El título descriptivo debe ser un resumen conciso y claro del cambio o la corrección
implementada. Debe alinearse con el título y la descripción del ticket de Jira
asociado.
Evitar títulos genéricos como "Arreglar errores" o "Implementar nueva funcionalidad"

En su lugar, proporcionar detalles específicos sobre qué ha cambiado.
Para los Pull Requests de tipo release, el título puede indicar la versión o la fecha
que se está deployando debido a que no necesariamente tienen un Ticket Jira
asociado.


6.3. Ejemplos de Nombres de Pull Request
feature(SP25-456): Implementar buscador de productos en la
página principal
bugfix(SP25-789): Corregir error de visualización de imágenes
en la galería
hotfix(DO-1012): Solucionar problema de rendimiento en la API
de subscripciones
release(2025-10-02): Release Integración BH
release(v1.0): Release v1.0



7. Consideraciones Adicionales y Buenas Prácticas
Longitud del Nombre: Mantener los nombres de los PRs dentro de un límite
razonable para asegurar su completa visualización en las interfaces de Git y otras
herramientas.
Verificación en la Revisión: Durante la revisión del código, se debe verificar que el
nombre del PR cumpla con esta convención y que el número de Jira sea válido y
relevante.
Consistencia en Releases: Asegurarse de que los PRs de release también sigan
la convención de nombres, incluyendo el número de Jira asociado a la preparación o
el contenido de la versión.
Comunicación: En caso de dudas sobre cómo nombrar un PR específico, consultar
con el equipo para asegurar la consistencia.



8. Proceso de Revisión y Aprobación
Al crear un Pull Request, el autor es responsable de asegurarse de que el nombre
cumpla con esta convención.
Los revisores de código verificarán el cumplimiento de esta convención como parte
del proceso de revisión. Los PRs que no sigan esta convención podrán ser
rechazados o requerir una modificación en el nombre antes de su aprobación.