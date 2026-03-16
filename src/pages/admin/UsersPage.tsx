import { useEffect, useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { toast } from "sonner";
import { Plus, Shield, Store, User as UserIcon } from "lucide-react";
import { createSecondaryAuth, db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { normalizeRole, type UserRole } from "@/lib/roles";

interface UserRecord {
  id: string;
  email: string | null;
  fullName: string | null;
  role: UserRole;
  createdAt: number | null;
}

interface UserDoc {
  email?: unknown;
  full_name?: unknown;
  displayName?: unknown;
  created_at?: unknown;
}

interface UserRoleDoc {
  role?: unknown;
}

const ROLE_META: Record<UserRole, { label: string; icon: typeof Shield; variant: "default" | "secondary" | "outline" }> = {
  admin: { label: "Admin", icon: Shield, variant: "default" },
  seller: { label: "Sotuvchi", icon: Store, variant: "secondary" },
  user: { label: "User", icon: UserIcon, variant: "outline" },
};

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function formatCreatedAt(value: number | null) {
  if (!value) return "Noma'lum";

  return new Intl.DateTimeFormat("uz-UZ", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

const initialForm = {
  fullName: "",
  email: "",
  password: "",
  role: "seller" as UserRole,
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [roleUpdatingId, setRoleUpdatingId] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);

  const fetchUsers = async () => {
    setLoading(true);

    try {
      const [usersSnap, rolesSnap] = await Promise.all([
        getDocs(query(collection(db, "users"), orderBy("created_at", "desc"))),
        getDocs(collection(db, "user_roles")),
      ]);

      const rolesMap = new Map<string, UserRole>();
      rolesSnap.forEach((roleDoc) => {
        const data = roleDoc.data() as UserRoleDoc;
        rolesMap.set(roleDoc.id, normalizeRole(data.role));
      });

      const nextUsers = usersSnap.docs.map((userDoc) => {
        const data = userDoc.data() as UserDoc;
        return {
          id: userDoc.id,
          email: asString(data.email),
          fullName: asString(data.full_name) ?? asString(data.displayName),
          role: rolesMap.get(userDoc.id) ?? "user",
          createdAt: asNumber(data.created_at),
        };
      });

      setUsers(nextUsers);
    } catch (error) {
      console.error("Foydalanuvchilarni yuklashda xato:", error);
      toast.error("Foydalanuvchilarni yuklab bo'lmadi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchUsers();
  }, []);

  const resetForm = () => {
    setForm(initialForm);
  };

  const handleCreateUser = async () => {
    if (!form.fullName.trim() || !form.email.trim() || !form.password.trim()) {
      toast.error("Ism, email va parol majburiy");
      return;
    }

    if (form.password.length < 6) {
      toast.error("Parol kamida 6 ta belgidan iborat bo'lsin");
      return;
    }

    setSaving(true);
    const secondary = createSecondaryAuth();

    try {
      const credentials = await createUserWithEmailAndPassword(
        secondary.auth,
        form.email.trim(),
        form.password,
      );

      await updateProfile(credentials.user, {
        displayName: form.fullName.trim(),
      });

      await setDoc(
        doc(db, "users", credentials.user.uid),
        {
          user_id: credentials.user.uid,
          email: form.email.trim(),
          full_name: form.fullName.trim(),
          displayName: form.fullName.trim(),
          is_blocked: false,
          email_verified: credentials.user.emailVerified,
          providers: ["password"],
          created_at: Date.now(),
          updated_at: Date.now(),
        },
        { merge: true },
      );

      await setDoc(
        doc(db, "user_roles", credentials.user.uid),
        {
          role: form.role,
          email: form.email.trim(),
          full_name: form.fullName.trim(),
          updated_at: serverTimestamp(),
        },
        { merge: true },
      );

      toast.success("Yangi foydalanuvchi qo'shildi");
      setDialogOpen(false);
      resetForm();
      await fetchUsers();
    } catch (error) {
      console.error("Foydalanuvchi qo'shishda xato:", error);
      toast.error(error instanceof Error ? error.message : "Foydalanuvchini qo'shib bo'lmadi");
    } finally {
      await secondary.dispose().catch((error) => {
        console.error("Secondary auth yopilmadi:", error);
      });
      setSaving(false);
    }
  };

  const handleRoleChange = async (userId: string, role: UserRole) => {
    const targetUser = users.find((item) => item.id === userId);
    if (!targetUser) return;

    setRoleUpdatingId(userId);

    try {
      await setDoc(
        doc(db, "user_roles", userId),
        {
          role,
          email: targetUser.email,
          full_name: targetUser.fullName,
          updated_at: serverTimestamp(),
        },
        { merge: true },
      );

      await updateDoc(doc(db, "users", userId), {
        updated_at: Date.now(),
      });

      setUsers((prev) => prev.map((item) => (item.id === userId ? { ...item, role } : item)));
      toast.success("Rol yangilandi");
    } catch (error) {
      console.error("Rolni yangilashda xato:", error);
      toast.error("Rolni yangilab bo'lmadi");
    } finally {
      setRoleUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Foydalanuvchilar</h1>
          <p className="text-sm text-muted-foreground">
            Admin, sotuvchi va oddiy user accountlarini shu yerdan boshqaring.
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Foydalanuvchi qo'shish
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Yangi foydalanuvchi</DialogTitle>
              <DialogDescription>
                Yangi account yarating va unga `admin`, `seller` yoki `user` rolini biriktiring.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">To'liq ism</Label>
                <Input
                  id="fullName"
                  value={form.fullName}
                  onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
                  placeholder="Ali Valiyev"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                  placeholder="seller@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Parol</Label>
                <Input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                  placeholder="Kamida 6 ta belgi"
                />
              </div>

              <div className="space-y-2">
                <Label>Rol</Label>
                <Select
                  value={form.role}
                  onValueChange={(value: UserRole) => setForm((prev) => ({ ...prev, role: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Rolni tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="seller">Sotuvchi</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button className="w-full" onClick={handleCreateUser} disabled={saving}>
                {saving ? "Saqlanmoqda..." : "Saqlash"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {(["admin", "seller", "user"] as UserRole[]).map((role) => {
          const meta = ROLE_META[role];
          const Icon = meta.icon;
          const total = users.filter((item) => item.role === role).length;

          return (
            <Card key={role} className="border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{meta.label}</CardTitle>
                <Icon className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{total}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Accountlar ro'yxati</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground">Yuklanmoqda...</div>
          ) : users.length === 0 ? (
            <div className="text-sm text-muted-foreground">Hali foydalanuvchilar topilmadi.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ism</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Yaratilgan vaqt</TableHead>
                  <TableHead className="w-[180px]">Rolni o'zgartirish</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((item) => {
                  const meta = ROLE_META[item.role];

                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.fullName ?? "Noma'lum"}</TableCell>
                      <TableCell>{item.email ?? "Noma'lum"}</TableCell>
                      <TableCell>
                        <Badge variant={meta.variant}>{meta.label}</Badge>
                      </TableCell>
                      <TableCell>{formatCreatedAt(item.createdAt)}</TableCell>
                      <TableCell>
                        <Select
                          value={item.role}
                          onValueChange={(value: UserRole) => void handleRoleChange(item.id, value)}
                          disabled={roleUpdatingId === item.id}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="seller">Sotuvchi</SelectItem>
                            <SelectItem value="user">User</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
