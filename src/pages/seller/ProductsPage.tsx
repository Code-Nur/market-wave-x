import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from "react";
import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query } from "firebase/firestore";
import { Plus, Trash2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  originalPrice: number;
  stock: number;
  badge: string;
  seller: string;
  image: string;
}

interface ProductDoc {
  name?: unknown;
  description?: unknown;
  category?: unknown;
  price?: unknown;
  originalPrice?: unknown;
  stock?: unknown;
  badge?: unknown;
  seller?: unknown;
  image?: unknown;
}

interface CategoryDoc {
  name?: unknown;
}

interface CategoryOption {
  id: string;
  name: string;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : Number(value) || 0;
}

function normalizeSeller(value: string | null | undefined): string {
  return value?.trim().toLowerCase() ?? "";
}

export default function SellerProductsPage() {
  const { user } = useUserRole();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "",
    badge: "sale",
    originalPrice: "",
    price: "",
    stock: "",
  });

  const sellerName = user?.displayName?.trim() || user?.email?.trim() || "";
  const sellerKeys = useMemo(
    () => [normalizeSeller(user?.displayName), normalizeSeller(user?.email)].filter(Boolean),
    [user],
  );

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = (error) => reject(error);
    });

  const fetchProducts = useCallback(async () => {
    try {
      const snapshot = await getDocs(query(collection(db, "products"), orderBy("created_at", "desc")));
      const mapped = snapshot.docs
        .map((snapshotDoc) => {
          const data = snapshotDoc.data() as ProductDoc;
          return {
            id: snapshotDoc.id,
            name: asString(data.name),
            description: asString(data.description),
            category: asString(data.category),
            price: asNumber(data.price),
            originalPrice: asNumber(data.originalPrice),
            stock: asNumber(data.stock),
            badge: asString(data.badge),
            seller: asString(data.seller),
            image: asString(data.image),
          };
        })
        .filter((item) => sellerKeys.includes(normalizeSeller(item.seller)));

      setProducts(mapped);
    } catch (error) {
      console.error("Seller mahsulotlarini yuklashda xato:", error);
      toast.error("Mahsulotlarni yuklab bo'lmadi");
    }
  }, [sellerKeys]);

  const fetchCategories = useCallback(async () => {
    try {
      const snapshot = await getDocs(query(collection(db, "categories"), orderBy("created_at", "desc")));
      const mapped = snapshot.docs
        .map((item) => {
          const data = item.data() as CategoryDoc;
          return {
            id: item.id,
            name: asString(data.name),
          };
        })
        .filter((item) => item.name.trim().length > 0);

      setCategories(mapped);
      if (mapped.length > 0) {
        setForm((prev) => ({
          ...prev,
          category: prev.category.trim() ? prev.category : mapped[0].id,
        }));
      }
    } catch (error) {
      console.error("Kategoriyalarni yuklashda xato:", error);
      toast.error("Kategoriyalarni yuklab bo'lmadi");
    }
  }, []);

  useEffect(() => {
    if (sellerKeys.length === 0) return;
    void fetchProducts();
    void fetchCategories();
  }, [fetchCategories, fetchProducts, sellerKeys]);

  const resetForm = () => {
    setForm({
      name: "",
      description: "",
      category: categories[0]?.id || "",
      badge: "sale",
      originalPrice: "",
      price: "",
      stock: "",
    });
    setNewImageFile(null);
    setImagePreview(null);
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setNewImageFile(file);

    if (file) {
      setImagePreview(URL.createObjectURL(file));
      return;
    }

    setImagePreview(null);
  };

  const handleAddProduct = async () => {
    if (
      !form.name.trim() ||
      !form.description.trim() ||
      !form.category.trim() ||
      !form.badge.trim() ||
      !form.price.trim() ||
      !form.originalPrice.trim() ||
      !form.stock.trim()
    ) {
      toast.error("Barcha maydonlarni to'ldiring");
      return;
    }

    const price = Number(form.price);
    const originalPrice = Number(form.originalPrice);
    const stock = Number(form.stock);
    const selectedCategory = categories.find((item) => item.id === form.category);

    if (!Number.isFinite(price) || !Number.isFinite(originalPrice) || !Number.isFinite(stock)) {
      toast.error("Raqamli maydonlar noto'g'ri");
      return;
    }
    if (price < 0 || originalPrice < 0 || stock < 0) {
      toast.error("Narx va stock manfiy bo'lmasin");
      return;
    }
    if (!newImageFile) {
      toast.error("Rasm yuklang");
      return;
    }
    if (!selectedCategory) {
      toast.error("Kategoriyani tanlang");
      return;
    }

    setSaving(true);

    try {
      const imageBase64 = await fileToBase64(newImageFile);
      await addDoc(collection(db, "products"), {
        name: form.name.trim(),
        description: form.description.trim(),
        category: selectedCategory.name,
        badge: form.badge.trim().toLowerCase(),
        image: imageBase64,
        originalPrice,
        price,
        rating: 5,
        reviews: 0,
        seller: sellerName,
        stock,
        created_at: Date.now(),
      });

      toast.success("Mahsulot qo'shildi");
      setDialogOpen(false);
      resetForm();
      await fetchProducts();
    } catch (error) {
      console.error("Seller mahsulot qo'shishda xato:", error);
      toast.error("Mahsulot qo'shib bo'lmadi");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Haqiqatan ham o'chirmoqchimisiz?")) return;

    try {
      await deleteDoc(doc(db, "products", id));
      setProducts((prev) => prev.filter((item) => item.id !== id));
      toast.success("Mahsulot o'chirildi");
    } catch (error) {
      console.error("Seller mahsulotni o'chirishda xato:", error);
      toast.error("Mahsulotni o'chirib bo'lmadi");
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mening mahsulotlarim</h1>
          <p className="text-sm text-muted-foreground">Mahsulotlar sizning seller nomingiz bilan saqlanadi.</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Mahsulot qo'shish
            </Button>
          </DialogTrigger>

          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Yangi mahsulot</DialogTitle>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Kategoriya</Label>
                <Select
                  value={form.category}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Kategoriyani tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Nomi</Label>
                <Input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
              </div>

              <div className="space-y-2">
                <Label>Tavsif</Label>
                <Textarea value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Narx</Label>
                  <Input type="number" value={form.price} onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Eski narx</Label>
                  <Input type="number" value={form.originalPrice} onChange={(e) => setForm((prev) => ({ ...prev, originalPrice: e.target.value }))} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Stock</Label>
                  <Input type="number" value={form.stock} onChange={(e) => setForm((prev) => ({ ...prev, stock: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Badge</Label>
                  <Input value={form.badge} onChange={(e) => setForm((prev) => ({ ...prev, badge: e.target.value }))} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Rasm</Label>
                <Input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} />
              </div>

              {imagePreview && (
                <div className="overflow-hidden rounded-md border">
                  <img src={imagePreview} alt="Preview" className="h-40 w-full object-cover" />
                </div>
              )}

              <Button onClick={handleAddProduct} disabled={saving}>
                {saving ? "Saqlanmoqda..." : "Saqlash"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {products.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">Sizga tegishli mahsulotlar yo'q</div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <div key={product.id} className="overflow-hidden rounded-lg border shadow-sm transition-shadow hover:shadow-md">
              {product.image ? (
                <img src={product.image} alt={product.name} className="h-48 w-full object-cover" />
              ) : (
                <div className="flex h-48 w-full items-center justify-center bg-gray-100 text-gray-400">Rasm yo'q</div>
              )}

              <div className="p-4">
                <h3 className="line-clamp-2 font-semibold">{product.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{product.category}</p>
                <p className="mt-1 text-lg font-bold">{product.price.toLocaleString()} so'm</p>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{product.description}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{product.stock} dona</span>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(product.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
