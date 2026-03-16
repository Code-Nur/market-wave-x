import admin from "firebase-admin";

const app = admin.apps.length
  ? admin.app()
  : admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });

const auth = admin.auth(app);
const db = admin.firestore(app);

async function run() {
  let nextPageToken;
  let processed = 0;

  do {
    const result = await auth.listUsers(1000, nextPageToken);

    const writes = result.users.map(async (u) => {
      const ref = db.collection("users").doc(u.uid);
      const existing = await ref.get();
      const prev = existing.exists ? existing.data() : {};

      await ref.set(
        {
          user_id: u.uid,
          email: u.email || null,
          full_name: u.displayName || prev?.full_name || null,
          phone: u.phoneNumber || null,
          is_blocked: prev?.is_blocked ?? Boolean(u.disabled),
          email_verified: Boolean(u.emailVerified),
          providers: (u.providerData || [])
            .map((p) => p?.providerId)
            .filter(Boolean),
          created_at: Number(u.metadata.creationTime ? new Date(u.metadata.creationTime).getTime() : Date.now()),
          last_login_at: u.metadata.lastSignInTime
            ? new Date(u.metadata.lastSignInTime).getTime()
            : null,
          updated_at: Date.now(),
        },
        { merge: true },
      );
    });

    await Promise.all(writes);
    processed += result.users.length;
    nextPageToken = result.pageToken;
  } while (nextPageToken);

  console.log(`Synced ${processed} auth users into Firestore users collection.`);
}

run().catch((err) => {
  console.error("Sync failed:", err);
  process.exit(1);
});
