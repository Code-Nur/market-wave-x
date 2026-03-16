import { useEffect, useRef } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { AdminChangePasswordDialog } from "@/components/AdminChangePasswordDialog";
import { useAdmin } from "@/hooks/useAdmin";
import { Skeleton } from "@/components/ui/skeleton";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";

export default function AdminLayout() {
  const { user, isAdmin, loading } = useAdmin();
  const soundBlockedNoticeShownRef = useRef(false);

  useEffect(() => {
    if (!user || !isAdmin) return;

    let initialized = false;
    const knownIds = new Set<string>();

    const unsubscribe = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        const newClientIds: string[] = [];

        snapshot.docChanges().forEach((change) => {
          if (change.type !== "added") return;

          if (!initialized) {
            knownIds.add(change.doc.id);
            return;
          }

          if (!knownIds.has(change.doc.id)) {
            knownIds.add(change.doc.id);
            newClientIds.push(change.doc.id);
          }
        });

        if (!initialized) {
          initialized = true;
          return;
        }

        if (newClientIds.length === 0) return;

        const audio = new Audio("/new_client.mp3");
        audio.currentTime = 0;
        void audio.play().catch((error) => {
          console.error("Yangi mijoz audio notification xatosi:", error);
          if (!soundBlockedNoticeShownRef.current) {
            soundBlockedNoticeShownRef.current = true;
            toast.error("Brauzer ovozni blokladi. Sahifada bir marta click qiling.");
          }
        });

        toast.success(`${newClientIds.length} ta yangi mijoz qo'shildi`);
      },
      (error) => {
        console.error("Users notification stream xatosi:", error);
      },
    );

    return () => {
      unsubscribe();
    };
  }, [user, isAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="space-y-4 w-64">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold text-destructive">Ruxsat yo'q</h1>
          <p className="text-muted-foreground">Sizda admin panelga kirish huquqi mavjud emas.</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b bg-card px-4 gap-3">
            <SidebarTrigger />
            <h2 className="font-semibold text-foreground">Admin Panel</h2>
            <div className="ml-auto flex items-center gap-3">
              <AdminChangePasswordDialog user={user} />
              <div className="text-sm text-muted-foreground">{user.email}</div>
            </div>
          </header>
          <main className="flex-1 p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
