// File: nesora-app/src/lib/sign-out.ts
import { authClient } from "@/lib/auth-client";
import { unregisterPush } from "@/lib/push";

export async function signOut() {
  await unregisterPush();
  await authClient.signOut();
}