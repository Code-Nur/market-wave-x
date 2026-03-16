import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { BadgeDollarSign, Boxes, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserRole } from "@/hooks/useUserRole";
import { db } from "@/lib/firebase";

interface ProductDoc {
  seller?: unknown;
  stock?: unknown;
  price?: unknown;
}

function asNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : Number(value) || 0;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export default function SellerDashboard() {
  const { user } = useUserRole();
  const [products, setProducts] = useState<ProductDoc[]>([]);
  const [loading, setLoading] = useState(true);

  const sellerKeys = useMemo(
    () => [user?.displayName, user?.email].map((item) => asString(item)).filter(Boolean),
    [user],
  );

  useEffect(() => {
    async function loadProducts() {
      try {
        const snapshot = await getDocs(collection(db, "products"));
        const filtered = snapshot.docs
          .map((item) => item.data() as ProductDoc)
          .filter((item) => sellerKeys.includes(asString(item.seller)));
        setProducts(filtered);
      } catch (error) {
        console.error("Seller dashboard ma'lumotlarini yuklashda xato:", error);
      } finally {
        setLoading(false);
      }
    }

    if (sellerKeys.length === 0) {
      setLoading(false);
      return;
    }

    void loadProducts();
  }, [sellerKeys]);

  const stats = [
    { title: "Mahsulotlar", value: products.length, icon: Package },
    {
      title: "Jami stock",
      value: products.reduce((sum, item) => sum + asNumber(item.stock), 0),
      icon: Boxes,
    },
    {
      title: "Taxminiy qiymat",
      value: `${products.reduce((sum, item) => sum + asNumber(item.stock) * asNumber(item.price), 0).toLocaleString()} so'm`,
      icon: BadgeDollarSign,
    },
  ];

  if (loading) return <div className="text-muted-foreground">Yuklanmoqda...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Seller panel</h1>
        <p className="text-sm text-muted-foreground">Sizga biriktirilgan mahsulotlar statistikasi.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((item) => (
          <Card key={item.title} className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{item.title}</CardTitle>
              <item.icon className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{item.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
