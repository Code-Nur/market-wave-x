import { useEffect, useMemo, useRef, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface OrderDoc {
  status?: unknown;
  total_amount?: unknown;
  totalAmount?: unknown;
  created_at?: unknown;
  createdAt?: unknown;
  updated_at?: unknown;
  updatedAt?: unknown;
  status_updated_at?: unknown;
  statusUpdatedAt?: unknown;
  admin_response?: unknown;
  adminResponse?: unknown;
}

interface UserOrder {
  id: string;
  status: string;
  total_amount: number;
  created_at: number | null;
  status_updated_at: number | null;
  admin_response: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Kutilmoqda",
  confirmed: "Tasdiqlangan",
  shipping: "Yuborilgan",
  delivered: "Yetkazilgan",
  cancelled: "Bekor qilingan",
  paid: "To'langan",
  shipped: "Yuborilgan",
};

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  confirmed: "default",
  shipping: "outline",
  delivered: "default",
  cancelled: "destructive",
  paid: "default",
  shipped: "outline",
};

function asNullableString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function asNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toMillis(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  if (value && typeof value === "object") {
    const source = value as { toMillis?: () => number; seconds?: number };
    if (typeof source.toMillis === "function") return source.toMillis();
    if (typeof source.seconds === "number") return source.seconds * 1000;
  }
  return null;
}

const formatDateTime = (value: number | null) => (value ? new Date(value).toLocaleString("uz-UZ") : "—");

export default function MyOrdersPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [ordersById, setOrdersById] = useState<Record<string, UserOrder>>({});
  const canNotifyRef = useRef(false);
  const firstQ1LoadedRef = useRef(false);
  const firstQ2LoadedRef = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setOrdersById({});
      canNotifyRef.current = false;
      firstQ1LoadedRef.current = false;
      firstQ2LoadedRef.current = false;
      return;
    }

    const mergeOrders = (docs: Array<{ id: string; data: OrderDoc }>) => {
      setOrdersById((prev) => {
        const next = { ...prev };
        docs.forEach((item) => {
          const data = item.data;
          const nextOrder: UserOrder = {
            id: item.id,
            status: asNullableString(data.status) ?? "pending",
            total_amount: asNumber(data.total_amount ?? data.totalAmount),
            created_at: toMillis(data.created_at ?? data.createdAt),
            status_updated_at: toMillis(
              data.status_updated_at ?? data.statusUpdatedAt ?? data.updated_at ?? data.updatedAt,
            ),
            admin_response: asNullableString(data.admin_response ?? data.adminResponse),
          };

          const prevOrder = prev[item.id];
          if (canNotifyRef.current) {
            if (!prevOrder) {
              toast.success(`Yangi buyurtma qabul qilindi (#${item.id.slice(0, 8)})`);
            } else if (prevOrder.status !== nextOrder.status) {
              const statusLabel = STATUS_LABELS[nextOrder.status] || nextOrder.status;
              toast.success(`Buyurtma #${item.id.slice(0, 8)} holati: ${statusLabel}`);
            }
          }

          next[item.id] = nextOrder;
        });
        return next;
      });
    };

    const q1 = query(collection(db, "orders"), where("customer_id", "==", currentUser.uid));
    const q2 = query(collection(db, "orders"), where("customerId", "==", currentUser.uid));

    const unsub1 = onSnapshot(q1, (snap) => {
      mergeOrders(snap.docs.map((d) => ({ id: d.id, data: d.data() as OrderDoc })));
      if (!firstQ1LoadedRef.current) {
        firstQ1LoadedRef.current = true;
        if (firstQ2LoadedRef.current) canNotifyRef.current = true;
      }
    });
    const unsub2 = onSnapshot(q2, (snap) => {
      mergeOrders(snap.docs.map((d) => ({ id: d.id, data: d.data() as OrderDoc })));
      if (!firstQ2LoadedRef.current) {
        firstQ2LoadedRef.current = true;
        if (firstQ1LoadedRef.current) canNotifyRef.current = true;
      }
    });

    return () => {
      unsub1();
      unsub2();
      canNotifyRef.current = false;
      firstQ1LoadedRef.current = false;
      firstQ2LoadedRef.current = false;
    };
  }, [currentUser]);

  const orders = useMemo(
    () =>
      Object.values(ordersById).sort((a, b) => {
        const aTime = a.created_at ?? 0;
        const bTime = b.created_at ?? 0;
        return bTime - aTime;
      }),
    [ordersById],
  );

  if (loading) return <div className="p-6 text-muted-foreground">Yuklanmoqda...</div>;

  if (!currentUser) {
    return <div className="p-6 text-muted-foreground">Buyurtmalarni ko'rish uchun tizimga kiring.</div>;
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <h1 className="text-2xl font-bold">Buyurtmalarim</h1>
      {orders.length === 0 ? (
        <p className="text-muted-foreground">Sizda hozircha buyurtmalar yo'q.</p>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-base">Buyurtma #{order.id.slice(0, 8)}</CardTitle>
                  <Badge variant={STATUS_VARIANTS[order.status] || "secondary"}>
                    {STATUS_LABELS[order.status] || order.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>
                  <span className="text-muted-foreground">Summa:</span> {order.total_amount.toLocaleString()} so'm
                </p>
                <p>
                  <span className="text-muted-foreground">Yaratilgan:</span> {formatDateTime(order.created_at)}
                </p>
                <p>
                  <span className="text-muted-foreground">Status yangilangan:</span>{" "}
                  {formatDateTime(order.status_updated_at)}
                </p>
                <p>
                  <span className="text-muted-foreground">Admin javobi:</span>{" "}
                  {order.admin_response ?? "Admin hali javob qoldirmagan. Tez orada yangilanadi."}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
