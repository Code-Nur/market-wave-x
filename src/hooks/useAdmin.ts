// hooks/useAdmin.ts
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import type { User } from "firebase/auth";

export function useAdmin() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const checkAdmin = async (currentUser: User | null) => {
      setUser(currentUser);

      if (currentUser && isMounted) {
        try {
          const docRef = doc(db, "user_roles", currentUser.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            setIsAdmin(data.role === "admin");
          } else {
            setIsAdmin(false);
          }
        } catch (error) {
          console.error("Rolni olishda xato:", error);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }

      if (isMounted) setLoading(false);
    };

    const unsubscribe = auth.onAuthStateChanged(checkAdmin);

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  return { user, isAdmin, loading };
}
