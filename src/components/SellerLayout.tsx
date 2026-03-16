import { Navigate, Outlet } from "react-router-dom";
import { SellerSidebar } from "@/components/SellerSidebar";
import { AdminChangePasswordDialog } from "@/components/AdminChangePasswordDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useUserRole } from "@/hooks/useUserRole";
import { getHomePathByRole } from "@/lib/roles";

export default function SellerLayout() {
  const { user, role, isSeller, loading } = useUserRole();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-64 space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!isSeller) return <Navigate to={getHomePathByRole(role)} replace />;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <SellerSidebar />
        <div className="flex flex-1 flex-col">
          <header className="flex h-14 items-center gap-3 border-b bg-card px-4">
            <SidebarTrigger />
            <h2 className="font-semibold text-foreground">Seller Panel</h2>
            <div className="ml-auto flex items-center gap-3">
              <AdminChangePasswordDialog user={user} />
              <div className="text-sm text-muted-foreground">{user.email}</div>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
