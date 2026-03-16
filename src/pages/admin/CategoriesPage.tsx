import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
} from "firebase/firestore";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Smartphone,
  Shirt,
  House,
  Sofa,
  Car,
  BookOpen,
  Baby,
  Dumbbell,
  UtensilsCrossed,
  Sparkles,
  Gem,
  PawPrint,
  Folder,
  type LucideIcon,
} from "lucide-react";

type CategoryIconKey =
  | "Smartphone"
  | "Shirt"
  | "House"
  | "Sofa"
  | "Car"
  | "BookOpen"
  | "Baby"
  | "Dumbbell"
  | "UtensilsCrossed"
  | "Sparkles"
  | "Gem"
  | "PawPrint";

const CATEGORY_ICONS: Record<CategoryIconKey, LucideIcon> = {
  Smartphone,
  Shirt,
  House,
  Sofa,
  Car,
  BookOpen,
  Baby,
  Dumbbell,
  UtensilsCrossed,
  Sparkles,
  Gem,
  PawPrint,
};

const ICON_OPTIONS: { value: CategoryIconKey; label: string }[] = [
  { value: "Smartphone", label: "Elektronika" },
  { value: "Shirt", label: "Kiyim-kechak" },
  { value: "House", label: "Uy-ro'zg'or" },
  { value: "Sofa", label: "Mebel" },
  { value: "Car", label: "Avto" },
  { value: "BookOpen", label: "Kitoblar" },
  { value: "Baby", label: "Bolalar" },
  { value: "Dumbbell", label: "Sport" },
  { value: "UtensilsCrossed", label: "Oziq-ovqat" },
  { value: "Sparkles", label: "Go'zallik" },
  { value: "Gem", label: "Aksessuarlar" },
  { value: "PawPrint", label: "Hayvonlar" },
];

interface Category {
  id: string;
  name: string;
  count: number;
  icon: string;
  created_at: number;
}

interface CategoryDoc {
  name?: unknown;
  count?: unknown;
  icon?: unknown;
  created_at?: unknown;
}

function toCount(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return Math.floor(value);
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed >= 0) return Math.floor(parsed);
  }
  return 0;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [count, setCount] = useState("0");
  const [icon, setIcon] = useState<CategoryIconKey | "">("");

  // 🔥 Fetch categories
  const fetchCategories = async () => {
    const q = query(
      collection(db, "categories"),
      orderBy("created_at", "desc"),
    );
    const snapshot = await getDocs(q);

    const list = snapshot.docs.map((snapshotDoc) => {
      const data = snapshotDoc.data() as CategoryDoc;
      return {
        id: snapshotDoc.id,
        name: typeof data.name === "string" ? data.name : "",
        count: toCount(data.count),
        icon: typeof data.icon === "string" ? data.icon : "",
        created_at: typeof data.created_at === "number" ? data.created_at : Date.now(),
      };
    });

    setCategories(list);
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // 🔥 Save (add or update)
  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Nom kiriting");
      return;
    }
    const parsedCount = Number(count);
    if (!Number.isInteger(parsedCount) || parsedCount < 0) {
      toast.error("Count musbat butun son bo'lishi kerak");
      return;
    }
    if (!icon) {
      toast.error("Kategoriya iconini tanlang");
      return;
    }

    if (editingId) {
      await updateDoc(doc(db, "categories", editingId), {
        name: name.trim(),
        count: parsedCount,
        icon,
      });
      toast.success("Kategoriya yangilandi");
    } else {
      await addDoc(collection(db, "categories"), {
        name: name.trim(),
        count: parsedCount,
        icon,
        created_at: Date.now(),
      });
      toast.success("Kategoriya qo'shildi");
    }

    resetForm();
    fetchCategories();
  };

  const handleEdit = (cat: Category) => {
    setEditingId(cat.id);
    setName(cat.name);
    setCount(String(cat.count));
    setIcon((cat.icon in CATEGORY_ICONS ? cat.icon : "") as CategoryIconKey | "");
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, "categories", id));
    toast.success("Kategoriya o'chirildi");
    fetchCategories();
  };

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setCount("0");
    setIcon("");
    setDialogOpen(false);
  };

  if (loading)
    return <div className="text-muted-foreground">Yuklanmoqda...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Kategoriyalar</h1>

        <Dialog
          open={dialogOpen}
          onOpenChange={(o) => {
            if (!o) resetForm();
            else setDialogOpen(true);
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" /> Qo'shish
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Kategoriyani tahrirlash" : "Yangi kategoriya"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nomi</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Masalan: Elektronika"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Count</Label>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    value={count}
                    onChange={(e) => setCount(e.target.value)}
                    placeholder="245"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Icon (Lucide)</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ICON_OPTIONS.map((item) => {
                    const Icon = CATEGORY_ICONS[item.value];
                    const active = icon === item.value;
                    return (
                      <Button
                        key={item.value}
                        type="button"
                        variant={active ? "default" : "outline"}
                        className="justify-start gap-2"
                        onClick={() => setIcon(item.value)}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <Button onClick={handleSave} className="w-full">
                {editingId ? "Saqlash" : "Qo'shish"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card rounded-xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Icon</TableHead>
              <TableHead>Nomi</TableHead>
              <TableHead>Count</TableHead>
              <TableHead>Yaratilgan</TableHead>
              <TableHead>Amal</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {categories.map((cat) => (
              <TableRow key={cat.id}>
                <TableCell>
                  {(() => {
                    const Icon = CATEGORY_ICONS[cat.icon as CategoryIconKey] || Folder;
                    return (
                      <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center">
                        <Icon className="h-4 w-4" />
                      </div>
                    );
                  })()}
                </TableCell>
                <TableCell className="font-medium">{cat.name}</TableCell>
                <TableCell className="text-muted-foreground">{cat.count}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(cat.created_at).toLocaleDateString("uz-UZ")}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEdit(cat)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => handleDelete(cat.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}

            {categories.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground py-8"
                >
                  Kategoriyalar topilmadi
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
