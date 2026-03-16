import { LayoutDashboard, LogOut, Package } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";

const menuItems = [
  { title: "Bosh sahifa", url: "/seller", icon: LayoutDashboard },
  { title: "Mahsulotlar", url: "/seller/products", icon: Package },
];

export function SellerSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await auth.signOut();
    toast.success("Tizimdan chiqdingiz");
    navigate("/login");
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-4 py-5">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
              <Package className="h-4 w-4 text-sidebar-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-sidebar-foreground">Seller Panel</span>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Boshqaruv</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={
                      item.url === "/seller"
                        ? location.pathname === "/seller"
                        : location.pathname.startsWith(item.url)
                    }
                  >
                    <NavLink
                      to={item.url}
                      end={item.url === "/seller"}
                      className="hover:bg-sidebar-accent/50"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-3 pb-4">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span>Chiqish</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
