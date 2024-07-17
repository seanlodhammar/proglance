CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text,
	"email" varchar(100) NOT NULL,
	"password" text NOT NULL
);
