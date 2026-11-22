# AI Quiz Live — Plan de implementación
**Evento:** Workshop DT DS León · **Idioma de la app:** inglés · **Deploy:** Vercel + Supabase

---

## 1. Resumen

Aplicación web en tiempo real estilo Kahoot para un test de 10 preguntas sobre IA (de básico a avanzado).

- **Pantalla del presentador (`/host`)**: se proyecta. Muestra el QR, el código de juego, el lobby con los jugadores, cada pregunta, el temporizador, las estadísticas y el podio final.
- **Dispositivo del asistente (`/`)**: escanea el QR → ingresa el código de 5 caracteres → nombre + avatar de animal → espera → responde cada pregunta con 4 botones de color.

### Decisiones confirmadas
| Tema | Decisión |
|---|---|
| Tiempo real | **Supabase** (Postgres + Realtime), plan gratuito |
| Asistentes | **Menos de 50** a la vez |
| Acceso del host | **Contraseña de administrador** (variable de entorno). Al entrar se genera un código aleatorio de 5 caracteres alfanuméricos |
| Vista en el teléfono | **Colores + forma + texto de la respuesta**. La pregunta completa se ve en la pantalla principal |
| Tiempo por pregunta | 20 segundos |

---

## 2. Stack técnico

| Capa | Herramienta | Por qué |
|---|---|---|
| Framework | **Next.js 15 (App Router) + TypeScript** | Deploy nativo en Vercel; las rutas API corren como funciones serverless |
| Estilos | **Tailwind CSS** | Rápido para lograr una interfaz vistosa tipo Kahoot |
| Animaciones | **Framer Motion** + **canvas-confetti** | Transiciones, barras del ranking, confeti en el podio |
| Tiempo real + BD | **Supabase** (`@supabase/supabase-js`) | Vercel no mantiene WebSockets; Supabase Realtime los resuelve |
| QR | **qrcode.react** | Genera el QR con la URL de Vercel y el código ya incluido |
| Validación | **zod** | Valida los datos que llegan a las rutas API |

---

## 3. Arquitectura

```
 Teléfonos (jugadores)            Pantalla del host (proyector)
        │   ▲                              │   ▲
  POST  │   │ Realtime (suscripción)  POST │   │ Realtime + polling de conteos
        ▼   │                              ▼   │
   ┌──────────────── Next.js en Vercel ────────────────┐
   │  /api/join  /api/answer  /api/host/*  (servidor)   │
   │  • Fuente de verdad del tiempo (reloj del servidor)│
   │  • Calcula puntos   • Guarda las respuestas        │
   │    correctas solo en el servidor                   │
   └───────────────┬────────────────────────────────────┘
                   │ service-role key
                   ▼
           ┌──────────────── Supabase ──────────────┐
           │ Postgres: games, players, answers      │
           │ Realtime: cambios en games y players   │
           └────────────────────────────────────────┘
```

**Principios clave**
1. **El servidor manda.** Todas las escrituras pasan por las rutas API con la service-role key. Los clientes solo **leen/escuchan** (anon key + RLS de solo lectura en columnas no sensibles).
2. **Las respuestas correctas nunca llegan al teléfono** antes de que se revelen. Las preguntas viven en un archivo del servidor (`src/data/questions.ts`). El teléfono solo recibe los textos de las opciones.
3. **El tiempo se mide en el servidor.** `games.question_started_at` se fija con `now()` de la BD. Al responder, el servidor calcula `elapsed_ms = now - question_started_at`. Así no importa si el reloj del teléfono está desajustado. Hay 500 ms de tolerancia por latencia; después de 20,5 s la respuesta se rechaza.
4. **Máquina de estados** en `games.phase`. El host la avanza y todos los clientes reaccionan vía Realtime.

---

## 4. Flujo del juego (máquina de estados)

```
lobby ──Start──▶ question ──Open answers──▶ answering ──(20s o todos respondieron)──▶ reveal
                     ▲                                                                   │
                     │                                                                   ▼
                     └──────────────────Next question────────────────────────── leaderboard
                                                                                         │
                                                                    (tras la pregunta 10)▼
                                                                                      podium
```

| Fase | Pantalla del host | Teléfono |
|---|---|---|
| `lobby` | QR grande + código + URL; los jugadores aparecen con su avatar al unirse; contador; botón **Start** | "You're in! Waiting for the host…" con su avatar |
| `question` | "Question 3 of 10", texto de la pregunta (tú la lees en voz alta); botón **Open answers** | "Get ready…" + número de pregunta |
| `answering` | Pregunta + 4 opciones de colores + cuenta regresiva de 20 s + "12/30 answered" | 4 botones (▲ rojo, ◆ azul, ● amarillo, ■ verde) con el texto. Tras tocar: "Answer locked in!" |
| `reveal` | Respuesta correcta resaltada + gráfico de barras con cuántos eligieron cada opción | ✅ "Correct! +873" / ❌ "Wrong" + racha + posición actual ("You're 4th") |
| `leaderboard` | Top 5 con barras animadas que se reordenan + ↑↓ cambios de posición; botón **Next question** | "You're in 4th place — 2,340 pts, 120 behind Fox 🦊" |
| `podium` | Revelación animada del 3º → 2º → 1º con confeti; botón **Show full ranking** | Posición final, puntos totales, aciertos (ej. 7/10) |

**Cierre automático:** si todos los jugadores conectados ya respondieron, el temporizador termina antes (configurable). El host también puede saltar con **Skip timer**.

> Nota: la fase `question` separada (antes de los 20 s) existe porque ustedes leen la pregunta en voz alta. El reloj empieza cuando presionas **Open answers**. Si prefieres que arranque solo tras una cuenta de 5 s, es una opción en la configuración.

---

## 5. Puntuación (estilo Kahoot)

```
correcta:    points = round(1000 × (1 − (elapsed_ms / 20000) / 2))   → entre 500 y 1000
incorrecta / sin respuesta: 0
bono de racha (opcional): +100 por cada respuesta correcta consecutiva desde la 2ª, máximo +500
```

- Responder al instante = 1000 pts; acertar en el último segundo = ~500 pts.
- Desempate en el ranking: 1) puntos, 2) más aciertos, 3) menor tiempo total de respuesta.
- Una sola respuesta por pregunta (restricción única en la BD: `player_id + question_index`).

---

## 6. Modelo de datos (Supabase)

```sql
create table games (
  id uuid primary key default gen_random_uuid(),
  code char(5) unique not null,            -- ej. 'K7P2X' (sin 0/O/1/I para evitar confusiones)
  phase text not null default 'lobby',     -- lobby|question|answering|reveal|leaderboard|podium
  current_q int not null default -1,       -- índice 0..9
  question_started_at timestamptz,
  question_ends_at timestamptz,
  created_at timestamptz default now()
);

create table players (
  id uuid primary key default gen_random_uuid(),
  game_id uuid references games(id) on delete cascade,
  name text not null,                      -- 1..16 caracteres, único por juego (sin distinguir mayúsculas)
  avatar text not null,                    -- clave del animal, ej. 'fox'
  score int not null default 0,
  correct_count int not null default 0,
  streak int not null default 0,
  total_time_ms int not null default 0,
  joined_at timestamptz default now(),
  unique (game_id, lower(name))
);

create table answers (
  id uuid primary key default gen_random_uuid(),
  game_id uuid references games(id) on delete cascade,
  player_id uuid references players(id) on delete cascade,
  question_index int not null,
  choice int not null,                     -- 0..3
  is_correct boolean not null,
  elapsed_ms int not null,
  points int not null,
  created_at timestamptz default now(),
  unique (player_id, question_index)
);
```

**RLS:** `games` y `players` permiten SELECT público (sin datos sensibles) para que Realtime funcione con la anon key. `answers` **no** tiene acceso público (evita trampas). El host obtiene los conteos por una ruta API protegida (polling cada ~1 s durante `answering`). Ninguna tabla permite escrituras desde el cliente.

**Puntaje:** se acumula en `players` dentro de la misma función de Postgres (`submit_answer` RPC) que inserta la respuesta, de forma atómica.

---

## 7. Rutas y páginas

### Páginas
| Ruta | Descripción |
|---|---|
| `/` | Ingreso del código (5 casillas, mayúsculas automáticas). Si llega `?code=K7P2X` desde el QR, se completa solo |
| `/play/[code]` | Formulario de nombre + selector de avatar → luego la vista del jugador según la fase |
| `/host` | Login con contraseña → **Create game** → panel del host |
| `/host/[code]` | Pantalla del presentador (optimizada para 16:9 en proyector) |

### API (Route Handlers)
| Método | Ruta | Función |
|---|---|---|
| POST | `/api/host/login` | Valida `ADMIN_PASSWORD` → cookie HTTP-only firmada |
| POST | `/api/host/games` | Crea el juego con un código único de 5 caracteres |
| POST | `/api/host/games/[code]/advance` | Avanza la fase (start / open / reveal / leaderboard / next / podium) |
| GET | `/api/host/games/[code]/stats` | Conteo de respuestas, distribución por opción, top 5 |
| POST | `/api/host/games/[code]/kick` | Expulsa un jugador (nombres inapropiados) |
| POST | `/api/join` | `{code, name, avatar}` → `{playerId, token}` (se guarda en localStorage) |
| POST | `/api/answer` | `{playerId, token, questionIndex, choice}` → se valida la ventana de tiempo y se puntúa |
| GET | `/api/game/[code]/question` | Pregunta actual **sin** la respuesta correcta (solo en `answering`) |
| GET | `/api/game/[code]/me` | Resultado, posición y estado del jugador (para el reveal y la reconexión) |

---

## 8. Avatares

16 animales con estilo uniforme (SVG o emoji grande sobre un círculo de color):
🦊 Fox · 🐼 Panda · 🦁 Lion · 🐯 Tiger · 🐨 Koala · 🐸 Frog · 🐵 Monkey · 🦉 Owl · 🐧 Penguin · 🐙 Octopus · 🦄 Unicorn · 🐢 Turtle · 🐬 Dolphin · 🦒 Giraffe · 🐝 Bee · 🦖 T-Rex

Se pueden repetir; el nombre identifica a cada jugador. MVP con emoji, que es lo más rápido. Opcional: SVG personalizados con los colores del workshop.

---

## 9. Contenido de las preguntas

Archivo: `src/data/questions.ts` (solo servidor, nunca se importa en componentes de cliente).

```ts
export const QUESTIONS: Question[] = [
  {
    id: 1,
    level: "Basic",               // Basic | Intermediate | Advanced (se muestra como etiqueta)
    text: "What does 'LLM' stand for?",
    options: ["Large Language Model", "Linear Logic Machine", "Low Latency Memory", "Learned Logic Module"],
    correct: 0,
    timeLimitSec: 20,
    explanation: "LLMs are neural networks trained on large text corpora…", // opcional, se muestra en el reveal
    image: undefined,             // opcional
  },
  // … 10 en total
];
```

**Pendiente de tu parte:** enviar las 10 preguntas (texto, 4 opciones, respuesta correcta y, si quieres, una explicación breve).

---

## 10. Robustez para un evento en vivo

- **Reconexión:** `playerId` + token en `localStorage`. Si el teléfono se bloquea o la página se recarga, el jugador vuelve a su estado actual sin perder puntos. El host también se reconecta (el estado está en la BD, no en memoria).
- **Unirse tarde:** permitido hasta que termine la pregunta 1 (configurable). Después: "Game already in progress".
- **Respaldo de Realtime:** si el WebSocket se cae, el cliente hace polling de `/api/game/[code]` cada 2 s hasta reconectarse.
- **Wake Lock API** en el teléfono para evitar que la pantalla se apague en el lobby.
- **Mobile-first:** botones grandes y fáciles de tocar, sin zoom accidental, prueba en Safari iOS y Chrome Android.
- **Moderación:** el host puede expulsar a un jugador desde el lobby; filtro básico de groserías en los nombres.
- **Proyector:** tipografía grande, alto contraste, legible a 10 m; modo pantalla completa (tecla F).
- **Atajos del host:** `Espacio` = siguiente paso, `F` = pantalla completa, `M` = silenciar.
- **Sonido (opcional):** música en el lobby, tic-tac en los últimos 5 s, efecto al revelar (solo en la pantalla del host).

---

## 11. Estructura del proyecto

```
src/
  app/
    page.tsx                      # ingreso del código
    play/[code]/page.tsx          # vista del jugador (cambia según la fase)
    host/page.tsx                 # login + crear juego
    host/[code]/page.tsx          # pantalla del presentador
    api/...                       # route handlers (sección 7)
  components/
    host/  Lobby, QuestionView, Countdown, AnswerChart, Leaderboard, Podium
    player/ JoinForm, AvatarPicker, AnswerButtons, ResultCard, FinalCard
    ui/    Logo, Button, AvatarBadge
  data/questions.ts               # solo servidor
  lib/
    supabase/{client,server}.ts
    scoring.ts                    # función pura, con pruebas unitarias
    code.ts                       # generador de códigos de 5 caracteres
    auth.ts                       # cookie de sesión del host
    useGameChannel.ts             # hook de Realtime con respaldo por polling
supabase/migrations/0001_init.sql
```

### Variables de entorno (Vercel)
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY     # solo servidor
ADMIN_PASSWORD
SESSION_SECRET                # para firmar la cookie del host
NEXT_PUBLIC_SITE_URL          # para el QR, ej. https://ai-quiz-leon.vercel.app
```

---

## 12. Fases de implementación

| # | Fase | Entregable |
|---|---|---|
| 1 | **Base** | Next.js + Tailwind + esquema de Supabase + variables de entorno + primer deploy en Vercel |
| 2 | **Host y lobby** | Login, crear juego, código, QR, los jugadores se unen con nombre y avatar y aparecen en vivo |
| 3 | **Ciclo de preguntas** | Máquina de estados, temporizador del servidor, botones de respuesta, puntuación, cierre automático |
| 4 | **Estadísticas** | Gráfico de distribución, feedback en el teléfono, leaderboard animado con cambios de posición |
| 5 | **Podio** | Revelación del 3º→1º, confeti, ranking completo, resumen final en cada teléfono |
| 6 | **Pulido** | Reconexión, wake lock, sonidos, atajos, branding del workshop, accesibilidad |
| 7 | **Pruebas** | Pruebas unitarias de la puntuación; script de carga con 60 bots simulados; ensayo completo en teléfonos reales iOS/Android |

**Ensayo antes del evento:** juego completo con 3–5 personas en la red Wi-Fi del lugar, proyectando desde la laptop real.

---

## 13. Preguntas pendientes

1. **Las 10 preguntas:** ¿me las compartes (texto, 4 opciones, correcta)? ¿Hay alguna de verdadero/falso (2 opciones)?
2. **¿Mostrar una explicación** de la respuesta correcta en el reveal? Es bueno para aprender, pero alarga la sesión.
3. **Branding:** ¿logo y colores del Workshop DT DS León? Si no hay, uso una paleta morada y oscura, estilo "AI".
4. **¿Leaderboard después de cada pregunta**, o solo cada 2–3 preguntas para ir más rápido?
5. **¿Exportar resultados** (CSV con nombres, puntos y aciertos) al final? Sale casi gratis.
6. **Dominio:** ¿basta con `*.vercel.app` o usarás un dominio propio?
7. **¿Reutilizar el juego?** ¿Necesitas poder reiniciar o crear varias sesiones (ej. dos grupos), o es una sola vez?
