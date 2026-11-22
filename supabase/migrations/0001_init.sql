-- AI Quiz Live: schema
-- All tables are locked down with RLS (no policies). Only the server, using the
-- service-role key, reads and writes them. Real-time updates use Supabase
-- Broadcast (no table access needed from the browser).

create extension if not exists pgcrypto;

create table if not exists games (
  id                  uuid primary key default gen_random_uuid(),
  code                char(5) unique not null,
  title               text,
  phase               text not null default 'lobby'
                        check (phase in ('lobby','question','answering','reveal','leaderboard','podium')),
  status              text not null default 'active' check (status in ('active','archived')),
  round               int  not null default 1,
  current_q           int  not null default -1,
  question_started_at timestamptz,
  question_ends_at    timestamptz,
  finished_at         timestamptz,
  created_at          timestamptz not null default now()
);

create table if not exists players (
  id        uuid primary key default gen_random_uuid(),
  game_id   uuid not null references games(id) on delete cascade,
  name      text not null check (char_length(name) between 1 and 16),
  avatar    text not null,
  token     text not null,
  joined_at timestamptz not null default now()
);
create unique index if not exists players_game_name_uq on players (game_id, lower(name));

create table if not exists answers (
  id             uuid primary key default gen_random_uuid(),
  game_id        uuid not null references games(id) on delete cascade,
  player_id      uuid references players(id) on delete set null, -- null after a "fresh" restart
  player_name    text not null,
  player_avatar  text not null,
  round          int  not null,
  question_index int  not null check (question_index between 0 and 99),
  choice         int  not null check (choice between 0 and 3),
  is_correct     boolean not null,
  elapsed_ms     int  not null,
  points         int  not null,
  created_at     timestamptz not null default now()
);
-- One answer per player per question per round.
create unique index if not exists answers_once_uq on answers (player_id, round, question_index);
create index if not exists answers_game_round_idx on answers (game_id, round);

alter table games   enable row level security;
alter table players enable row level security;
alter table answers enable row level security;
