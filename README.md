# mcp-github-agent

Un **MCP Server** (Model Context Protocol) que expone operaciones de GitHub como *tools* para que un agente de IA (Gemini, Claude, u otro LLM compatible) las ejecute a partir de instrucciones en lenguaje natural.

Construido como Proyecto Integrador de la especialización Backend en Henry, dentro del contexto ficticio de AutomateHub, una startup de herramientas de automatización para equipos de desarrollo.

---

## ¿Qué hace?

Este server conecta un host MCP (como [Antigravity](https://antigravity.google)) con la API real de GitHub, a través de 5 *tools*:

| Tool | Qué hace |
| --- | --- |
| `create_repository` | Crea un nuevo repositorio en la cuenta del usuario autenticado |
| `create_issue` | Abre un issue en un repositorio existente |
| `list_repositories` | Lista los repositorios del usuario autenticado, con filtros |
| `create_commit` | Crea o actualiza un archivo en un repositorio mediante un commit |
| `list_issues` | Lista los issues de un repositorio específico |

En vez de que el usuario tenga que recordar comandos de `git`/`gh` o navegar la web de GitHub, le puede pedir al agente cosas como *"creá un repo llamado `mi-proyecto` y abrile un issue pidiendo el setup inicial"* — el LLM interpreta la instrucción, elige las tools correctas, arma los parámetros, y este server las ejecuta.

### Casos de uso

- Automatizar tareas repetitivas de setup de repositorios (crear repo + issue inicial + README).
- Triage rápido de issues abiertos en un repo, sin salir del chat con el agente.
- Registrar cambios chicos (documentación, configuración) sin cambiar de contexto a una terminal.

---

## Requisitos del sistema

- **Node.js** 18 o superior (desarrollado y probado con Node 22.23.1)
- **npm** (incluido con Node)
- Una cuenta de **GitHub** con posibilidad de generar un Personal Access Token
- [Antigravity](https://antigravity.google) u otro host MCP compatible con transporte `stdio` (opcionalmente, [MCP Inspector](https://github.com/modelcontextprotocol/inspector) para debugging)

---

## Instalación

1. Cloná el repositorio:

   ```bash
   git clone https://github.com/valenberdev/mcp-github-agent.git
   cd mcp-github-agent
   ```

2. Instalá las dependencias:

   ```bash
   npm install
   ```

3. Compilá el proyecto:

   ```bash
   npm run build
   ```

   Esto genera la carpeta `dist/` con el JavaScript compilado, usando `tsconfig.build.json`.

---

## Configuración

### 1. Obtener un GitHub Personal Access Token

1. Andá a GitHub → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**.
2. **Generate new token (classic)**.
3. Elegí una expiración razonable (ej. 90 días) — evitá "No expiration" por buena práctica de seguridad.
4. Marcá los scopes necesarios (ver abajo).
5. Generá el token y **copialo en el momento** — GitHub solo lo muestra una vez.

### 2. Scopes necesarios

| Scope | Para qué se usa |
| --- | --- |
| `repo` | Crear repositorios, issues y commits (control completo sobre repos) |
| `user` | Leer información del usuario autenticado |

> El scope `admin:org` **no es necesario** para las 5 tools base, ya que todas operan sobre el usuario autenticado, no sobre organizaciones. Solo haría falta si se extiende el proyecto para operar sobre repos de una organización.

### 3. Configurar `.env`

Copiá el archivo de ejemplo y completá tu token:

```bash
cp .env.example .env
```

Editá `.env`:

```bash
GITHUB_TOKEN=tu_token_aca
```

> ⚠️ **Nunca subas el archivo `.env` al repositorio.** Ya está incluido en `.gitignore`. Si tu token se sube por error a un repo público, revocalo inmediatamente desde GitHub, aunque lo borres en un commit posterior — queda expuesto en el historial.

### 4. Configurar el MCP server en Antigravity

1. Abrí Antigravity.
2. En el panel del chat de IA, hacé click en los tres puntos (`...`) → **MCP Servers**.
3. Click en **Manage MCP Servers** → **View raw config**. Esto abre (o crea) el archivo `mcp_config.json`, ubicado en:
   - **Windows**: `C:\Users\<TU_USUARIO>\.gemini\antigravity\mcp_config.json`
   - **macOS/Linux**: `~/.gemini/antigravity/mcp_config.json`
4. Agregá esta entrada dentro de `"mcpServers"` (ajustá la ruta al path real donde clonaste el proyecto):

   ```json
   {
     "mcpServers": {
       "github-agent": {
         "command": "node",
         "args": ["C:\\ruta\\completa\\a\\mcp-github-agent\\dist\\index.js"],
         "env": {
           "GITHUB_TOKEN": "tu_token_aca"
         }
       }
     }
   }
   ```

5. Guardá el archivo, cerrá Antigravity por completo y volvé a abrirlo.
6. En el panel de MCP Servers deberías ver `github-agent` con las 5 tools listadas.

> Ver la sección [Troubleshooting](#troubleshooting) si la conexión con Antigravity falla en Windows.

---

## Documentación de las tools

### `create_repository`

Crea un nuevo repositorio en GitHub para el usuario autenticado.

**Parámetros:**

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `name` | string (1-100 caracteres, alfanumérico + `-` `_` `.`) | Sí | Nombre del repositorio |
| `description` | string | No | Descripción del repositorio |
| `private` | boolean (default `false`) | No | Si el repo es privado |

**Ejemplo de prompt efectivo:**
> "Creá un repositorio privado llamado `api-clientes` con la descripción 'API interna de gestión de clientes'."

**Output esperado:**
```json
{
  "ok": true,
  "data": {
    "full_name": "valenberdev/api-clientes",
    "html_url": "https://github.com/valenberdev/api-clientes",
    "private": true,
    "description": "API interna de gestión de clientes",
    "owner": { "login": "valenberdev" }
  }
}
```

---

### `create_issue`

Abre un nuevo issue en un repositorio existente.

**Parámetros:**

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `owner` | string (máx. 39 caracteres) | Sí | Dueño del repositorio |
| `repo` | string (1-100 caracteres) | Sí | Nombre del repositorio |
| `title` | string (3-100 caracteres) | Sí | Título del issue |
| `body` | string | No | Descripción del issue |

**Ejemplo de prompt efectivo:**
> "Abrí un issue en `valenberdev/api-clientes` con el título 'Falta validación de email' y describí que el endpoint de registro no valida el formato."

**Output esperado:**
```json
{
  "ok": true,
  "data": {
    "number": 3,
    "title": "Falta validación de email",
    "html_url": "https://github.com/valenberdev/api-clientes/issues/3",
    "state": "open"
  }
}
```

---

### `list_repositories`

Lista los repositorios del usuario autenticado, con filtros de tipo y orden.

**Parámetros:**

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `type` | `"all"` \| `"public"` \| `"private"` (default `"all"`) | No | Filtro por visibilidad |
| `sort` | `"created"` \| `"updated"` \| `"pushed"` \| `"full_name"` (default `"updated"`) | No | Criterio de orden |
| `per_page` | number 1-100 (default `30`) | No | Cantidad de resultados |

**Ejemplo de prompt efectivo:**
> "Mostrame mis 10 repositorios privados más recientemente actualizados."

**Output esperado:**
```json
{
  "ok": true,
  "data": [
    {
      "full_name": "valenberdev/api-clientes",
      "html_url": "https://github.com/valenberdev/api-clientes",
      "private": true,
      "description": "API interna de gestión de clientes",
      "owner": { "login": "valenberdev" }
    }
  ]
}
```

---

### `create_commit`

Crea o actualiza un archivo en un repositorio mediante un commit.

**Parámetros:**

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `owner` | string (máx. 39 caracteres) | Sí | Dueño del repositorio |
| `repo` | string (1-100 caracteres) | Sí | Nombre del repositorio |
| `path` | string | Sí | Ruta del archivo dentro del repo |
| `content` | string | Sí | Contenido del archivo (texto plano) |
| `message` | string (3-100 caracteres) | Sí | Mensaje del commit |

**Ejemplo de prompt efectivo:**
> "En el repo `api-clientes`, creá un archivo `docs/setup.md` con instrucciones básicas de instalación, con el mensaje de commit 'Agrega guía de setup'."

**Output esperado:**
```json
{
  "ok": true,
  "data": {
    "sha": "a1b2c3d4e5f6...",
    "html_url": "https://github.com/valenberdev/api-clientes/commit/a1b2c3d4e5f6..."
  }
}
```

⚠️ **Limitación conocida**: esta tool está pensada principalmente para **crear** archivos nuevos. Actualizar un archivo ya existente puede fallar, porque la API de GitHub requiere el `sha` del blob actual para evitar sobrescribir cambios de otra persona, y esta versión no lo resuelve automáticamente.

---

### `list_issues`

Lista los issues de un repositorio específico.

**Parámetros:**

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `owner` | string (máx. 39 caracteres) | Sí | Dueño del repositorio |
| `repo` | string (1-100 caracteres) | Sí | Nombre del repositorio |
| `state` | `"open"` \| `"closed"` \| `"all"` (default `"open"`) | No | Filtro por estado |
| `per_page` | number 1-100 (default `30`) | No | Cantidad de resultados |

**Ejemplo de prompt efectivo:**
> "Listame todos los issues abiertos del repositorio `api-clientes`."

**Output esperado:**
```json
{
  "ok": true,
  "data": {
    "items": [
      {
        "number": 3,
        "title": "Falta validación de email",
        "html_url": "https://github.com/valenberdev/api-clientes/issues/3",
        "state": "open"
      }
    ]
  }
}
```

---

## Diagrama de arquitectura

```text
┌─────────────────────┐
│   Antigravity (Host)  │  gestiona la sesión y conecta los componentes
└──────────┬───────────┘
           │
┌──────────▼───────────┐
│   LLM (Client)         │  lee las descripciones de los tools,
│   Gemini / Claude      │  decide cuál invocar y con qué parámetros
└──────────┬───────────┘
           │  JSON-RPC sobre stdio
┌──────────▼───────────┐
│   MCP Server (este repo) │
│                         │
│  1. Recibe la llamada al tool
│  2. Valida el input con Zod (schemas/)
│  3. Ejecuta la operación (github/operations.ts)
│     envuelta en retry con backoff (utils/retry.ts)
│  4. Si falla, transforma el error técnico
│     en lenguaje natural (errors/index.ts)
│  5. Devuelve { ok, data } o { ok, error }
└──────────┬───────────┘
           │  Octokit (REST)
┌──────────▼───────────┐
│   GitHub API            │
└─────────────────────┘
```

### Estructura del código

```text
src/
├── tools/          # Los 5 tools MCP (validación + orquestación)
├── schemas/        # Schemas de Zod + tipos inferidos (single source of truth)
├── github/
│   ├── client.ts    # Instancia de Octokit (auth)
│   └── operations.ts # Llamadas puras a la API de GitHub
├── errors/         # Clases de error custom + transformación a lenguaje natural
├── utils/
│   ├── retry.ts     # Backoff exponencial para rate limiting
│   └── logging.ts   # Logger estructurado (niveles), siempre a stderr
├── server.ts       # Registro de tools con el SDK MCP
├── index.ts        # Entry point (stdio)
└── types.ts        # Tipos compartidos (Result<T>, ToolDefinition)
```

La separación entre `client.ts` y `operations.ts` es deliberada: permite mockear el cliente de Octokit en los tests sin tocar la lógica de negocio (ver `tests/github.test.ts`).

---

## Cómo correr los tests

```bash
npm test
```

Corre la suite completa con Vitest, repartida en:

- `tests/tools.test.ts` — validación de schemas de Zod (inputs válidos e inválidos)
- `tests/tools.integration.test.ts` — los 5 handlers completos (validación → operación mockeada → resultado), incluyendo que un input inválido no llega a llamar a Octokit
- `tests/github.test.ts` — las 5 operaciones de GitHub, con Octokit **mockeado** (sin llamadas reales a la API)
- `tests/errors.test.ts` — transformación de errores (404, 401, 403, 429, sin conexión) a mensajes en lenguaje natural
- `tests/retry.test.ts` — lógica de backoff exponencial (reintenta ante 429, falla inmediato ante otros errores)

---

## Scripts disponibles

| Script | Qué hace |
| --- | --- |
| `npm run build` | Compila TypeScript a JavaScript (`dist/`) |
| `npm run dev` | Corre el server en modo desarrollo con `tsx` (sin compilar) |
| `npm test` | Corre la suite de tests con Vitest |
| `npm run lint` | Chequea tipos sin emitir archivos (`tsc --noEmit`) |

---

## Troubleshooting

### El server no arranca / MCP Inspector no lo detecta

- Verificá que `.env` tenga `GITHUB_TOKEN` configurado — el server hace *fail-fast* (`process.exit(1)`) si falta.
- Si usás `npm run dev` como comando en Inspector, puede fallar el handshake porque `npm` imprime su propio banner por stdout. Usá `npx tsx src/index.ts` directo como comando en su lugar.

### Error 401/403 al ejecutar una tool

- Confirmá que el token no haya expirado.
- Confirmá que el token tenga los scopes `repo` y `user` (ver sección de Configuración).

### Error 404 al operar sobre un repositorio

- Verificá que el nombre del repo y el owner sean exactos (sensible a mayúsculas/minúsculas en algunos casos).
- Si el repo es privado y no es tuyo, confirmá que tu token tenga acceso.

### `create_commit` falla al actualizar un archivo existente

Limitación conocida — ver la nota en la documentación de esa tool más arriba.

### Conexión con Antigravity falla en Windows con: `invalid character '◇' looking for beginning of value`

Este es un **bug conocido de Antigravity en Windows** con servers MCP locales por `stdio`, reportado en el foro oficial de Google Antigravity y en otros proyectos MCP (por ejemplo, el server oficial de Azure MCP presenta el mismo error exacto). No es un problema de este proyecto.

Se probaron y descartaron las siguientes causas:

- Ejecutar vía `npx tsx` en lugar del binario compilado
- Ejecutar el binario `tsx.cmd` directo, sin pasar por `npx`
- Compilar y ejecutar con `node dist/index.js` directo
- Ejecutar a través de `cmd /c node ...`
- Redirigir cualquier `console.log`/`warn`/`info` accidental hacia `stderr`

En **todos** los casos, el error persiste de forma idéntica — lo cual, sumado a que el server funciona correctamente en **MCP Inspector** (con las 5 tools validadas contra la API real de GitHub), indica que la causa está en el cliente MCP de Antigravity sobre Windows, no en la implementación del server.

**Recomendación**: usar MCP Inspector para debugging técnico, y Claude Desktop como host MCP alternativo para demostrar el flujo completo con un LLM real (ver [Evidencia de integración](#evidencia-de-integración)) mientras el bug de Antigravity no tenga una solución oficial.

---

## Evidencia de integración

Además de la validación con MCP Inspector, el server fue conectado y probado en **Claude Desktop** como host MCP alternativo — confirmando que el proyecto es interoperable con cualquier host compatible con el protocolo estándar, no solo con una herramienta puntual.

### Configuración

Mismo mecanismo que con Antigravity (bloque `command`/`args`/`env` en el archivo de configuración del host), pero en la ubicación específica de Claude Desktop:

- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "github-agent": {
      "command": "node",
      "args": ["C:\\ruta\\completa\\a\\mcp-github-agent\\dist\\index.js"],
      "env": {
        "GITHUB_TOKEN": "tu_token_aca"
      }
    }
  }
}
```

### Escenario 1 — Lectura: `list_repositories`

**Prompt:** *"Listá mis repositorios de GitHub."*

El LLM identificó y ejecutó `list_repositories` sin intervención manual, devolviendo `ok: true` con los repositorios reales de la cuenta autenticada (incluyendo `mcp-github-agent`, con la licencia MIT ya reflejada por GitHub).

### Escenario 2 — Escritura: `create_issue`

**Prompt:** *"Creá un issue en el repo `test-mcp-agent-borrar` como evidencia de escritura end-to-end."*

El LLM identificó y ejecutó `create_issue` con los parámetros correctos (`owner`, `repo`, `title`, `body`), devolviendo `ok: true`. El issue quedó creado y visible en GitHub: [`test-mcp-agent-borrar#2`](https://github.com/valenberdev/test-mcp-agent-borrar/issues/2).

| Escenario | Tool | Resultado |
| --- | --- | --- |
| Lectura | `list_repositories` | 10 repositorios devueltos, `ok: true` |
| Escritura | `create_issue` | Issue #2 creado y visible en GitHub |

---

## Licencia

MIT — ver [LICENSE](./LICENSE).