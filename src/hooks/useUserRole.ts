import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { normalizeRole, type UserRole } from "@/lib/roles";

export function useUserRole() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>("user");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadRole = async (currentUser: User | null) => {
      setUser(currentUser);

      if (!currentUser) {
        if (isMounted) {
          setRole("user");
          setLoading(false);
        }
        return;
      }

      try {
        const snapshot = await getDoc(doc(db, "user_roles", currentUser.uid));
        if (!isMounted) return;
        setRole(normalizeRole(snapshot.data()?.role));
      } catch (error) {
        console.error("Foydalanuvchi rolini olishda xato:", error);
        if (isMounted) {
          setRole("user");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setLoading(true);
      void loadRole(currentUser);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  return {
    user,
    role,
    isAdmin: role === "admin",
    isSeller: role === "seller",
    loading,
  };
}
