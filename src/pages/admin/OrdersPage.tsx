import { useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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
  paid: "default",
  shipped: "outline",
  delivered: "default",
  cancelled: "destructive",
};

interface Order {
  id: string;
  customer_id: string;
  total_amount: number;
  status: string;
  shipping_address: string | ShippingAddress | null;
  created_at: number | null;
  updated_at: number | null;
  status_updated_at: number | null;
  admin_response: string | null;
  customer_name: string | null;
}

interface OrderData {
  customer_id?: string;
  customerId?: string;
  total_amount?: number | string;
  totalAmount?: number | string;
  status?: string;
  shipping_address?: unknown;
  shippingAddress?: unknown;
  created_at?: number | null;
  createdAt?: number | null;
  updated_at?: number | null;
  updatedAt?: number | null;
  status_updated_at?: number | null;
  statusUpdatedAt?: number | null;
  admin_response?: string | null;
  adminResponse?: string | null;
  items?: OrderItem[];
}

interface ShippingAddress {
  fullName: string | null;
  region: string | null;
  comment: string | null;
  address: string | null;
  phone: string | null;
}

interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  product_name: string | null;
}

interface OrderItemData {
  quantity?: number;
  unit_price?: number;
  unitPrice?: number;
  product_name?: string | null;
  productName?: string | null;
}

interface UserData {
  full_name?: string | null;
  displayName?: string | null;
}

function asNullableString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
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

function parseShippingAddress(value: unknown): string | ShippingAddress | null {
  if (typeof value === "string") {
    return asNullableString(value);
  }

  if (value && typeof value === "object") {
    const source = value as Record<string, unknown>;
    const parsed: ShippingAddress = {
      fullName: asNullableString(source.fullName),
      region: asNullableString(source.region),
      comment: asNullableString(source.comment),
      address: asNullableString(source.address),
      phone: asNullableString(source.phone),
    };

    if (parsed.fullName || parsed.region || parsed.comment || parsed.address || parsed.phone) {
      return parsed;
    }
  }

  return null;
}

export default function OrdersPage() {
  const [ordersData, setOrdersData] = useState<Array<{ id: string; data: OrderData }>>([]);
  const [usersMap, setUsersMap] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [adminResponseDraft, setAdminResponseDraft] = useState("");
  const [savingResponse, setSavingResponse] = useState(false);

  const orders = useMemo<Order[]>(
    () =>
      ordersData.map((orderDoc) => {
        const order = orderDoc.data;
        const customerId = order.customer_id ?? order.customerId ?? "";
        const shippingAddress = parseShippingAddress(order.shipping_address ?? order.shippingAddress);
        const shippingAddressFullName =
          shippingAddress && typeof shippingAddress === "object" ? shippingAddress.fullName : null;

        return {
          id: orderDoc.id,
          customer_id: customerId,
          total_amount: Number(order.total_amount ?? order.totalAmount ?? 0),
          status: order.status ?? "pending",
          shipping_address: shippingAddress,
          created_at: toMillis(order.created_at ?? order.createdAt),
          updated_at: toMillis(order.updated_at ?? order.updatedAt),
          status_updated_at: toMillis(order.status_updated_at ?? order.statusUpdatedAt ?? order.updated_at ?? order.updatedAt),
          admin_response: asNullableString(order.admin_response ?? order.adminResponse),
          customer_name: usersMap[customerId] ?? shippingAddressFullName ?? null,
        };
      }),
    [ordersData, usersMap],
  );

  const selectedOrder = useMemo(
    () => orders.find((item) => item.id === selectedOrderId) ?? null,
    [orders, selectedOrderId],
  );

  useEffect(() => {
    setAdminResponseDraft(selectedOrder?.admin_response ?? "");
  }, [selectedOrderId, selectedOrder?.admin_response]);

  useEffect(() => {
    const ordersQuery = query(collection(db, "orders"), orderBy("created_at", "desc"));
    const unsubscribeOrders = onSnapshot(
      ordersQuery,
      (snapshot) => {
        setOrdersData(snapshot.docs.map((orderDoc) => ({ id: orderDoc.id, data: orderDoc.data() as OrderData })));
        setLoading(false);
      },
      (error) => {
        console.error("Buyurtmalar stream xatosi:", error);
        toast.error("Buyurtmalarni real-time yuklashda xatolik");
        setLoading(false);
      },
    );

    const unsubscribeUsers = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        const nextUsersMap: Record<string, string | null> = {};
        snapshot.docs.forEach((userDoc) => {
          const data = userDoc.data() as UserData;
          nextUsersMap[userDoc.id] = data.full_name ?? data.displayName ?? null;
        });
        setUsersMap(nextUsersMap);
      },
      (error) => {
        console.error("Users stream xatosi:", error);
        toast.error("Foydalanuvchi ma'lumotlarini real-time olishda xatolik");
      },
    );

    return () => {
      unsubscribeOrders();
      unsubscribeUsers();
    };
  }, []);

  const changeStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "orders", orderId), {
        status: newStatus,
        status_updated_at: Date.now(),
        updated_at: Date.now(),
      });

      toast.success(`Status "${STATUS_LABELS[newStatus]}" ga o'zgartirildi`);
    } catch (error) {
      console.error("Buyurtma statusini yangilashda xato:", error);
      toast.error("Xatolik");
    }
  };

  const saveAdminResponse = async () => {
    if (!selectedOrder) return;
    setSavingResponse(true);
    try {
      await updateDoc(doc(db, "orders", selectedOrder.id), {
        admin_response: adminResponseDraft.trim() || null,
        updated_at: Date.now(),
      });
      toast.success("Admin javobi saqlandi");
    } catch (error) {
      console.error("Admin javobini saqlashda xato:", error);
      toast.error("Admin javobini saqlab bo'lmadi");
    } finally {
      setSavingResponse(false);
    }
  };

  const formatDateTime = (value: number | null) =>
    value ? new Date(value).toLocaleString("uz-UZ") : "—";

  const openDetails = (order: Order) => {
    setSelectedOrderId(order.id);
  };

  useEffect(() => {
    if (!selectedOrderId) {
      setOrderItems([]);
      return;
    }

    const itemsQuery = query(collection(db, "order_items"), where("order_id", "==", selectedOrderId));
    const unsubscribeItems = onSnapshot(
      itemsQuery,
      (snapshot) => {
        const mappedItems: OrderItem[] = snapshot.docs.map((itemDoc) => {
          const item = itemDoc.data() as OrderItemData;
          return {
            id: itemDoc.id,
            quantity: item.quantity ?? 0,
            unit_price: item.unit_price ?? item.unitPrice ?? 0,
            product_name: item.product_name ?? item.productName ?? null,
          };
        });
        setOrderItems(mappedItems);
      },
      (error) => {
        console.error("Buyurtma itemlari stream xatosi:", error);
        toast.error("Buyurtma tafsilotlarini real-time olishda xatolik");
        setOrderItems([]);
      },
    );

    return () => {
      unsubscribeItems();
    };
  }, [selectedOrderId]);

  if (loading) return <div className="text-muted-foreground">Yuklanmoqda...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Buyurtmalar</h1>

      <div className="bg-card rounded-xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Xaridor</TableHead>
              <TableHead>Summa</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Sana</TableHead>
              <TableHead>Status o'zgartirish</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((o) => (
              <TableRow key={o.id} className="cursor-pointer" onClick={() => openDetails(o)}>
                <TableCell className="font-mono text-xs">{o.id.slice(0, 8)}...</TableCell>
                <TableCell>{o.customer_name || "—"}</TableCell>
                <TableCell className="font-medium">{Number(o.total_amount).toLocaleString()} so'm</TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANTS[o.status] || "secondary"}>
                    {STATUS_LABELS[o.status] || o.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {o.created_at ? new Date(o.created_at).toLocaleDateString("uz-UZ") : "—"}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Select value={o.status} onValueChange={(v) => changeStatus(o.id, v)}>
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
            {orders.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Buyurtmalar topilmadi
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={Boolean(selectedOrder)} onOpenChange={() => setSelectedOrderId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Buyurtma tafsilotlari</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">ID:</span> {selectedOrder.id.slice(0, 8)}
                </div>
                <div>
                  <span className="text-muted-foreground">Xaridor:</span> {selectedOrder.customer_name || "—"}
                </div>
                <div>
                  <span className="text-muted-foreground">Summa:</span>{" "}
                  {Number(selectedOrder.total_amount).toLocaleString()} so'm
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span> {STATUS_LABELS[selectedOrder.status]}
                </div>
                <div>
                  <span className="text-muted-foreground">Yaratilgan:</span> {formatDateTime(selectedOrder.created_at)}
                </div>
                <div>
                  <span className="text-muted-foreground">Status yangilangan:</span>{" "}
                  {formatDateTime(selectedOrder.status_updated_at)}
                </div>
                {selectedOrder.shipping_address && typeof selectedOrder.shipping_address === "object" ? (
                  <>
                    <div>
                      <span className="text-muted-foreground">Buyurtmachi:</span>{" "}
                      {selectedOrder.shipping_address.fullName || "—"}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Telefon:</span>{" "}
                      {selectedOrder.shipping_address.phone || "—"}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Hudud:</span>{" "}
                      {selectedOrder.shipping_address.region || "—"}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Manzil:</span>{" "}
                      {selectedOrder.shipping_address.address || "—"}
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Izoh:</span>{" "}
                      {selectedOrder.shipping_address.comment || "—"}
                    </div>
                  </>
                ) : (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Manzil:</span>{" "}
                    {selectedOrder.shipping_address || "Ko'rsatilmagan"}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">Admin javobi</h3>
                <Textarea
                  value={adminResponseDraft}
                  onChange={(event) => setAdminResponseDraft(event.target.value)}
                  placeholder="Mijoz uchun izoh yozing"
                />
                <div className="flex justify-end">
                  <Button onClick={saveAdminResponse} disabled={savingResponse}>
                    {savingResponse ? "Saqlanmoqda..." : "Javobni saqlash"}
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Mahsulotlar</h3>
                {orderItems.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mahsulot</TableHead>
                        <TableHead>Soni</TableHead>
                        <TableHead>Narx</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orderItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.product_name || "—"}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{Number(item.unit_price).toLocaleString()} so'm</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground text-sm">Mahsulotlar topilmadi</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
