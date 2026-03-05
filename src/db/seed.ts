import { config } from "dotenv";
config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { hash } from "bcryptjs";
import * as schema from "./schema";

async function main() {
  const client = createClient({
    url: process.env.DATABASE_URL!,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });

  const db = drizzle(client, { schema });

  console.log("Seeding database...");

  const hashedPassword = await hash("password123", 10);

  await db
    .insert(schema.users)
    .values({
      name: "Test User",
      email: "test@test.com",
      password: hashedPassword,
      avatarColor: "#6366f1",
    })
    .onConflictDoNothing();

  console.log("Seed complete. Test user: test@test.com / password123");

  client.close();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
