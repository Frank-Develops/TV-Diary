set client_min_messages to warning;

-- DANGER: this is NOT how to do it in the real world.
-- `drop schema` INSTANTLY ERASES EVERYTHING.
drop schema "public" cascade;

create schema "public";

create table "watchlist" (
  "entryId" serial,
  "userId" text,
  "show" text,
  "episode name" text,
  "season" text,
  "number" text,
  "image" text,
  "isWatched" boolean,
  primary key ("entryId")
);

create table "log" (
  "logId" serial,
  "userId" text,
  "show" text,
  "episode name" text,
  "season" text,
  "number" text,
  "image" text,
  "date" text,
  "rating" text,
  primary key("logId")
);

create table "users" (
  "userId"         serial,
  "username"       text           not null,
  "hashedPassword" text           not null,
  "createdAt"      timestamptz(6) not null default now(),
  primary key ("userId"),
  unique ("username")
);
