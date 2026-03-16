import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ShoppingCart, DollarSign, Store } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface Stats {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  activeSellers: number;
}

interface OrderDoc {
  total_amount?: number | string;
  totalAmount?: number | string;
  status?: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "hsl(38, 92%, 50%)",
  paid: "hsl(230, 65%, 52%)",
  shipped: "hsl(200, 70%, 50%)",
  delivered: "hsl(160, 60%, 45%)",
  cancelled: "hsl(0, 72%, 51%)",
};

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    activeSellers: 0,
  });
  const [ordersByStatus, setOrdersByStatus] = useState<{ name: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [usersSnap, ordersSnap, sellerRolesSnap] = await Promise.all([
          getDocs(collection(db, "users")),
          getDocs(collection(db, "orders")),
          getDocs(query(collection(db, "user_roles"), where("role", "==", "seller"))),
        ]);

        const orders = ordersSnap.docs.map((item) => item.data() as OrderDoc);
        const totalRevenue = orders.reduce((sum, order) => {
          const value = order.total_amount ?? order.totalAmount ?? 0;
          return sum + Number(value);
        }, 0);

        const statusMap: Record<string, number> = {};
        orders.forEach((order) => {
          const status = order.status || "pending";
          statusMap[status] = (statusMap[status] || 0) + 1;
        });

        setStats({
          totalUsers: usersSnap.size,
          totalOrders: orders.length,
          totalRevenue,
          activeSellers: sellerRolesSnap.size,
        });

        setOrdersByStatus(
          Object.entries(statusMap).map(([name, value]) => ({
            name,
            value,
          })),
        );
      } catch (error) {
        console.error("Dashboard ma'lumotlarini olishda xato:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  const statCards = [
    { title: "Jami foydalanuvchilar", value: stats.totalUsers, icon: Users, color: "text-primary" },
    { title: "Jami buyurtmalar", value: stats.totalOrders, icon: ShoppingCart, color: "text-accent" },
    {
      title: "Jami daromad",
      value: `${stats.totalRevenue.toLocaleString()} so'm`,
      icon: DollarSign,
      color: "text-success",
    },
    { title: "Faol sotuvchilar", value: stats.activeSellers, icon: Store, color: "text-warning" },
  ];

  if (loading) return <div className="text-muted-foreground">Yuklanmoqda...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Bosh sahifa</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Card key={s.title} className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.title}</CardTitle>
              <s.icon className={`h-5 w-5 ${s.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Buyurtmalar holati</CardTitle>
          </CardHeader>
          <CardContent>
            {ordersByStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={ordersByStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {ordersByStatus.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={STATUS_COLORS[entry.name] || "hsl(220, 14%, 92%)"}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-10">Ma'lumot yo'q</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Buyurtmalar soni (status bo'yicha)</CardTitle>
          </CardHeader>
          <CardContent>
            {ordersByStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={ordersByStatus}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(230, 65%, 52%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-10">Ma'lumot yo'q</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
