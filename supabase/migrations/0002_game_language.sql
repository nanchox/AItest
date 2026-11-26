-- Each game is shown in one language, chosen by the host (and changeable at any time).
alter table games add column if not exists lang text not null default 'en' check (lang in ('en','es'));
