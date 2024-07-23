ALTER TABLE "cases" ALTER COLUMN "type" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "cases" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "cases" ADD COLUMN "created_at" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "cases" ADD COLUMN "expires_at" integer NOT NULL;