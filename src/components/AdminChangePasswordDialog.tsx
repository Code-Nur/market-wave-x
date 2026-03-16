import { useState } from "react";
import type { User } from "firebase/auth";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface AdminChangePasswordDialogProps {
  user: User;
}

function getErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) return "Noma'lum xatolik yuz berdi";

  switch (error.message) {
    case "Firebase: Error (auth/invalid-credential).":
      return "Joriy parol noto'g'ri";
    case "Firebase: Password should be at least 6 characters (auth/weak-password).":
      return "Yangi parol kamida 6 ta belgidan iborat bo'lishi kerak";
    case "Firebase: Error (auth/too-many-requests).":
      return "Juda ko'p urinish bo'ldi. Birozdan keyin qayta urinib ko'ring";
    default:
      return error.message;
  }
}

export function AdminChangePasswordDialog({
  user,
}: AdminChangePasswordDialogProps) {
  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) resetForm();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user.email) {
      toast.error("Admin email manzili topilmadi");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Yangi parol kamida 6 ta belgidan iborat bo'lishi kerak");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Yangi parollar mos emas");
      return;
    }

    if (currentPassword === newPassword) {
      toast.error("Yangi parol joriy paroldan farq qilishi kerak");
      return;
    }

    setLoading(true);

    try {
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword,
      );

      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);

      toast.success("Parol muvaffaqiyatli yangilandi");
      handleOpenChange(false);
    } catch (error) {
      console.error("Parolni yangilashda xato:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Parolni almashtirish
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Admin parolini yangilash</DialogTitle>
          <DialogDescription>
            Joriy parolni tasdiqlang va yangi parol kiriting.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Joriy parol</Label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              placeholder="Joriy parolni kiriting"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-password">Yangi parol</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="Kamida 6 ta belgi"
              minLength={6}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Yangi parolni tasdiqlang</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Yangi parolni qayta kiriting"
              minLength={6}
              required
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
