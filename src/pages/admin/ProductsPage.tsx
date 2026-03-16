import { useEffect, useState, type ChangeEvent } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

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
  rating: number;
  reviews: number;
  created_at?: number;
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
  rating?: unknown;
  reviews?: unknown;
  created_at?: unknown;
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

export default function ProductsPage() {
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
    rating: "4.8",
    reviews: "0",
    seller: "",
    stock: "",
  });

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = (error) => reject(error);
    });

  // Mahsulotlarni yuklash
  const fetchProducts = async () => {
    try {
      const q = query(
        collection(db, "products"),
        orderBy("created_at", "desc"),
      );
      const snapshot = await getDocs(q);
      const prods = snapshot.docs.map((snapshotDoc) => {
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
          rating: asNumber(data.rating),
          reviews: asNumber(data.reviews),
          created_at: asNumber(data.created_at),
        };
      });
      setProducts(prods);
    } catch (err) {
      console.error("Mahsulotlarni yuklashda xato:", err);
      toast.error("Mahsulotlarni yuklab bo'lmadi");
    }
  };

  const fetchCategories = async () => {
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
    } catch (err) {
      console.error("Kategoriyalarni yuklashda xato:", err);
      toast.error("Kategoriyalarni yuklab bo'lmadi");
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  // Mahsulot qo'shish
  const handleAddProduct = async () => {
    if (
      !form.name.trim() ||
      !form.description.trim() ||
      !form.category.trim() ||
      !form.badge.trim() ||
      !form.price.trim() ||
      !form.originalPrice.trim() ||
      !form.rating.trim() ||
      !form.reviews.trim() ||
      !form.seller.trim() ||
      !form.stock.trim()
    ) {
      toast.error("Barcha maydonlarni to'ldiring");
      return;
    }

    const price = Number(form.price);
    const originalPrice = Number(form.originalPrice);
    const rating = Number(form.rating);
    const reviews = Number(form.reviews);
    const stock = Number(form.stock);
    const selectedCategory = categories.find((item) => item.id === form.category);

    if (
      !Number.isFinite(price) ||
      !Number.isFinite(originalPrice) ||
      !Number.isFinite(rating) ||
      !Number.isFinite(reviews) ||
      !Number.isFinite(stock)
    ) {
      toast.error("Raqamli maydonlar to'g'ri formatda bo'lishi kerak");
      return;
    }
    if (price < 0 || originalPrice < 0 || reviews < 0 || stock < 0) {
      toast.error("Narx, reviews va stock manfiy bo'lmasin");
      return;
    }
    if (rating < 0 || rating > 5) {
      toast.error("Rating 0 dan 5 gacha bo'lishi kerak");
      return;
    }
    if (!newImageFile) {
      toast.error("Rasm yuklash majburiy");
      return;
    }
    if (!selectedCategory) {
      toast.error("Kategoriyani tanlang");
      return;
    }

    setSaving(true);

    try {
      const imageBase64 = await fileToBase64(newImageFile);
      if (!imageBase64) {
        toast.error("Rasmni o'qib bo'lmadi");
        setSaving(false);
        return;
      }

      await addDoc(collection(db, "products"), {
        name: form.name.trim(),
        description: form.description.trim(),
        category: selectedCategory.name,
        badge: form.badge.trim().toLowerCase(),
        image: imageBase64,
        originalPrice,
        price,
        rating,
        reviews,
        seller: form.seller.trim(),
        stock,
        created_at: Date.now(),
      });

      toast.success("Mahsulot muvaffaqiyatli qo'shildi!");
      setDialogOpen(false);
      resetForm();
      fetchProducts();
    } catch (err) {
      console.error("Qo'shishda xato:", err);
      toast.error("Mahsulot qo'shishda xato yuz berdi");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setForm({
      name: "",
      description: "",
      category: categories[0]?.id || "",
      badge: "sale",
      originalPrice: "",
      price: "",
      rating: "4.8",
      reviews: "0",
      seller: "",
      stock: "",
    });
    setNewImageFile(null);
    setImagePreview(null);
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setNewImageFile(file);

    if (file) {
      setImagePreview(URL.createObjectURL(file));
      return;
    }
    setImagePreview(null);
  };

  // O'chirish
  const handleDelete = async (id: string) => {
    if (!confirm("Haqiqatan ham o'chirmoqchimisiz?")) return;

    try {
      await deleteDoc(doc(db, "products", id));
      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast.success("Mahsulot o'chirildi");
    } catch (err) {
      console.error("O'chirishda xato:", err);
      toast.error("O'chirishda xato yuz berdi");
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">Mahsulotlar</h1>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Mahsulot qo'shish
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Yangi mahsulot qo'shish</DialogTitle>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Category</Label>
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
                <Label>Name</Label>
                <Input
                  placeholder="Simsiz Bluetooth Quloqchin"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Mahsulot tavsifi"
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Price</Label>
                  <Input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Original Price</Label>
                  <Input
                    type="number"
                    value={form.originalPrice}
                    onChange={(e) => setForm((prev) => ({ ...prev, originalPrice: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Stock</Label>
                  <Input
                    type="number"
                    value={form.stock}
                    onChange={(e) => setForm((prev) => ({ ...prev, stock: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Badge</Label>
                  <Input
                    placeholder="sale"
                    value={form.badge}
                    onChange={(e) => setForm((prev) => ({ ...prev, badge: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Rating (0-5)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={form.rating}
                    onChange={(e) => setForm((prev) => ({ ...prev, rating: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Reviews</Label>
                  <Input
                    type="number"
                    min="0"
                    value={form.reviews}
                    onChange={(e) => setForm((prev) => ({ ...prev, reviews: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Seller</Label>
                <Input
                  placeholder="TechStore UZ"
                  value={form.seller}
                  onChange={(e) => setForm((prev) => ({ ...prev, seller: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Image File</Label>
                <Input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                />
              </div>

              {imagePreview && (
                <div className="border rounded-md overflow-hidden">
                  <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover" />
                </div>
              )}

              <Button
                onClick={handleAddProduct}
                disabled={saving}
                className="mt-2"
              >
                {saving ? "Saqlanmoqda..." : "Saqlash"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Mahsulotlar ro'yxati */}
      {products.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Hozircha mahsulotlar yo'q
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 bg-gray-100 flex items-center justify-center text-gray-400">
                  Rasm yo'q
                </div>
              )}

              <div className="p-4">
                <h3 className="font-semibold line-clamp-2">{product.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{product.category}</p>
                <p className="text-lg font-bold mt-1">
                  {product.price.toLocaleString()} so'm
                </p>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                  {product.description}
                </p>
                <div className="flex justify-between items-center mt-3">
                  <span className="text-sm text-muted-foreground">
                    {product.stock} dona
                  </span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(product.id)}
                  >
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
