# Decisiones técnicas — mcp-github-agent

Este documento registra las decisiones de diseño tomadas durante el desarrollo, con su justificación. Pensado como apoyo para la defensa del proyecto: cada decisión listada acá debería poder explicarse sin mirar el código.

---

## Arquitectura general

### Separación en capas (`tools/`, `schemas/`, `github/`, `errors/`, `utils/`)

Cada capa tiene una única responsabilidad:

- **`schemas/`**: valida la forma del input y es la fuente de verdad de los tipos (vía `z.infer`), sin saber nada de GitHub ni del protocolo MCP.
- **`github/`**: sabe hablar con la API de GitHub (vía Octokit), sin saber nada de Zod ni del formato de respuesta que espera el LLM.
- **`errors/`**: sabe transformar errores técnicos en mensajes de lenguaje natural, sin saber de dónde vino el error originalmente.
- **`tools/`**: es la única capa que conoce a todas las demás — orquesta validación → operación → manejo de error → respuesta.

La ventaja concreta de esta separación se ve en testing: cada capa se puede probar de forma aislada (ver sección Testing).

### `client.ts` separado de `operations.ts`

`client.ts` solo crea y exporta la instancia de Octokit. `operations.ts` importa esa instancia y la usa. Esta separación existe **específicamente para poder mockear** en los tests: con `vi.mock("../src/github/client.js")`, se reemplaza la instancia real de Octokit por una controlada, sin tocar la lógica de `operations.ts`. Si todo estuviera en un mismo archivo, mockear una función obligaría también a mockear la creación del cliente y su lógica de *fail-fast*.

### Fail-fast en `client.ts`

Si `GITHUB_TOKEN` no está definido, el proceso llama a `process.exit(1)` al importar el módulo, en lugar de fallar más adelante en cada llamada individual. Decisión justificada porque las 5 tools dependen al 100% de GitHub — no tiene sentido que el server arranque "a medias" sin la única credencial que necesita para funcionar.

---

## Tipos y validación

### `z.infer` en lugar de `interface`/`type` manuales

Cada schema de Zod genera su tipo TypeScript correspondiente con `z.infer<typeof Schema>`, en vez de escribir un `interface` a mano al lado. Esto evita tener la misma forma de datos escrita dos veces: si el schema cambia, el tipo se actualiza automáticamente, sin riesgo de que queden desincronizados.

### Validaciones que reflejan restricciones reales de GitHub

Los schemas no solo validan "que no esté vacío" — reflejan reglas reales de la API (ej. límite de 39 caracteres en `owner`, que es el límite real de un username de GitHub; regex de nombre de repo que permite `-`, `_`, `.`). El objetivo es que la validación falle **antes** de gastar una llamada de red hacia una API que de todas formas la iba a rechazar, y que el mensaje de error sea controlado por este proyecto (en español, específico) en lugar de depender del formato de error crudo de GitHub.

### `description` como `.nullable()`, no `.optional()`, en los DTOs de salida

La API de GitHub devuelve explícitamente `null` en el campo `description` de un repo sin descripción — no omite la clave. `.nullable()` refleja ese comportamiento real; `.optional()` hubiera sido incorrecto.

### Los DTOs de salida se validan en `tools/*.ts`, no en `operations.ts`

Cada handler llama a `DTO.parse(...)` sobre el resultado crudo de `operations.ts`, justo antes de armar `{ ok: true, data }`. La responsabilidad se ubica ahí (y no en `operations.ts`) por el mismo criterio usado para decidir dónde iba la codificación a base64 en `create_commit`: `operations.ts` sabe hablar con Octokit, pero no le corresponde saber cuál es el contrato de salida que el LLM espera — eso es responsabilidad de la capa que orquesta.

Un caso concreto que motivó esta decisión: la respuesta cruda de `createOrUpdateFileContents` (usada en `create_commit`) tiene el `sha` y el `html_url` anidados dentro de `commit: {...}`, mientras que `CommitDTO` los expone planos (`{ sha, html_url }`). El handler de `create-commit.ts` extrae explícitamente esos dos campos del objeto anidado antes de validarlos contra el DTO — la transformación de forma vive en el mismo lugar que la validación de forma.

Como `DTO.parse(...)` lanza una excepción (`ZodError`) si el dato no calza con el schema, `handleError()` tiene una rama específica para reconocer ese caso (`err.name === "ZodError"`) y devolver un mensaje propio, en lugar de que caiga por accidente en la rama de "sin conexión" (que también detecta ausencia de `.status`, un falso positivo si no se contempla este caso aparte).

---

## Manejo de errores

### 4 categorías de error custom (`ValidationError`, `AuthenticationError`, `GitHubAPIError`, `NetworkError`)

Cada clase representa una causa raíz distinta, para poder dar una respuesta accionable en cada caso: un error de validación se soluciona corrigiendo el input, uno de autenticación revisando el token, uno de red revisando la conexión. Agruparlos todos bajo un solo tipo de error genérico hubiera perdido esa distinción, que es justamente lo que le permite al LLM comunicarle al usuario **qué hacer**, no solo que algo falló.

### Mensajes en lenguaje natural, no stack traces

La función `handleError()` transforma cualquier error crudo (de Octokit o de red) en un mensaje pensado para que el LLM se lo pueda repetir directamente al usuario. Ejemplo: un 404 se convierte en *"El repositorio no fue encontrado. Verifica el nombre e intenta de nuevo"*, en vez de propagar el objeto de error de Octokit tal cual.

### El mensaje de 429 describe lo que ya pasó, no lo que va a pasar

`handleError()` solo recibe un error 429 cuando `withRetry()` ya agotó todos sus reintentos — mientras quedan reintentos disponibles, `withRetry()` los consume internamente sin propagar el error hacia arriba. Por eso el mensaje final dice *"se agotaron los reintentos automáticos"*, no que "se va a reintentar" — en el momento en que el usuario lo ve, ya no hay más reintentos pendientes.

### 401 y 403 ya no comparten el mismo mensaje

Un 403 de GitHub no siempre significa token inválido — también puede deberse a un token sin el scope necesario para esa operación puntual, o a un rate limit secundario (detectado buscando la frase "rate limit" en el mensaje de error de Octokit). Cada causa tiene su propio mensaje accionable, en vez de un genérico "verificá tu token" que sería engañoso para los otros dos casos.

### `context` opcional en `handleError(err, context?)`

Algunas tools operan sobre un recurso puntual (crear un issue en *tal* repo) y otras son lecturas generales (listar los propios repos). Para las primeras, pasar `{ resource: "repositorio" }` permite armar un mensaje de 404 específico. Para `list_repositories`, se decidió **no** pasar contexto: como no hay un repo puntual involucrado en el input, decir "el repositorio no fue encontrado" sería confuso — se prefirió el mensaje genérico de fallback antes que uno específico pero engañoso.

### Retry con backoff exponencial solo para 429

`withRetry()` solo reintenta ante rate limiting (status 429). Cualquier otro error (404, 401, etc.) se propaga de inmediato, sin reintentos — reintentar un error que no es transitorio (como un repo inexistente) no lo va a resolver, solo demora la respuesta al usuario. El delay entre reintentos se duplica en cada intento (1s, 2s, 4s...) en lugar de ser fijo, porque reintentar de inmediato dentro de la misma ventana de rate limit agotada es matemáticamente inútil — la API va a seguir rechazando hasta que la ventana se resetee.

### Timeout de 10s en el cliente de Octokit

Sin un límite de tiempo, una llamada que se cuelga (sin fallar, simplemente sin responder) dejaría a `withRetry()` esperando indefinidamente, sin ningún error que capturar ni transformar. El timeout se configuró una sola vez en `client.ts` (opción `request.timeout` de Octokit), de forma que las 5 operaciones lo heredan automáticamente sin tener que repetir la configuración en cada una. Un timeout cumplido no tiene `.status` HTTP (nunca hubo respuesta), así que `handleError()` ya lo clasifica correctamente como `NetworkError` sin necesitar una rama nueva.

---

## Logging

### Todo el logging va a `stderr`, nunca a `stdout`

La comunicación del MCP server con el host ocurre por `stdout` mediante el protocolo JSON-RPC. Cualquier texto que no sea parte de ese protocolo (como un `console.log` de debug) contamina la comunicación y puede romper el handshake. El logger custom (`utils/logging.ts`) usa `console.error` internamente en los 4 niveles (`debug`/`info`/`warn`/`error`) — el "nivel" es solo una etiqueta semántica y un filtro de verbosidad vía `LOG_LEVEL`, nunca determina a qué stream se escribe.

Como medida de seguridad adicional, `index.ts` sobreescribe `console.log`/`console.info`/`console.warn` para que redirijan a `console.error` — así, aunque una dependencia externa llame a `console.log` por error, no rompe el protocolo.

---

## Decisiones de tipado (TypeScript)

### `(server.tool as any)` al registrar las tools en un loop

El SDK de MCP (`@modelcontextprotocol/sdk@1.30.0`) tipa `server.tool()` con un genérico que liga el tipo del schema al tipo del callback. Al iterar sobre un array `ToolDefinition[]` (donde `inputSchema` está tipado de forma genérica como `ZodRawShape`), TypeScript no logra inferir ese genérico correctamente y ninguno de los overloads matchea. Se optó por un cast `(server.tool as any)` puntual en esa llamada, en lugar de debilitar el tipado del resto del proyecto. Es un trade-off consciente: cada pieza (`inputSchema`, `handler`) ya fue validada individualmente antes de llegar a ese punto, así que el cast no oculta un bug real, solo evita un problema de inferencia genérica sin una solución más limpia dada la estructura elegida.

### Dos archivos de configuración de TypeScript (`tsconfig.json` y `tsconfig.build.json`)

`tsconfig.json` (el que usa el editor) incluye `src/` y `tests/`, sin restricción estricta de `rootDir` — necesario porque el editor no soporta fácilmente aplicar configuraciones distintas por carpeta. `tsconfig.build.json` extiende del anterior pero restringe `rootDir` a `src/` y excluye los tests, para que `npm run build` solo compile el código de producción. Separarlos evita el conflicto entre "el build no debe incluir tests" y "el editor necesita ver los tests para tipar bien".

---

## Extra credit elegido

Se implementó **logging estructurado con niveles** (`utils/logging.ts`), dentro de la categoría "Experiencia de desarrollador mejorada". Se eligió esta opción sobre las otras dos (tools avanzados, configuración multi-usuario) porque `utils/logging.ts` ya era parte de la estructura base obligatoria del proyecto — implementarlo con niveles en lugar de un logger plano no agregó una superficie de trabajo nueva significativa, aprovechando una pieza que había que construir de todas formas.

---

## Problema conocido, no resuelto

### Conexión con Antigravity en Windows

Ver la sección de Troubleshooting en el `README.md`. Se documenta con detalle porque refleja un proceso real de debugging: se descartaron 4 hipótesis distintas (resolución de `npx`, el loader `tsx`, contaminación de `stdout` por logs propios, el wrapper de shell de Windows) antes de concluir, con evidencia de un bug reportado públicamente en el foro oficial de Antigravity y en otros proyectos MCP, que la causa excede el alcance de este proyecto.
