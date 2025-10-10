import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

import { Account } from "@/types";
import { supabase } from "@/lib/supabaseClient";

interface EditAccountDialogProps {
  account: Account | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccountUpdated: (updatedAccount: Account) => void;
}

export function EditAccountDialog({
  account,
  open,
  onOpenChange,
  onAccountUpdated,
}: EditAccountDialogProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState<{
    name: string;
    type: string;
    balance: number;
  }>({
    name: "",
    type: "bank",
    balance: 0,
  });

  useEffect(() => {
    if (account) {
      setFormData({
        name: account.name,
        type: account.type || "bank",
        balance: account.balance ?? 0,
      });
    }
  }, [account]);

  const accountTypeOptions = [
    { value: "bank", label: "Bank Account" },
    { value: "cash", label: "Cash" },
    { value: "credit_card", label: "Credit Card" },
    { value: "investment", label: "Investment" },
    { value: "other", label: "Other" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !account) return;

    if (!formData.name) {
      toast({
        title: "Missing fields",
        description: "Please enter the account name.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const updatedData = {
      name: formData.name,
      type: formData.type,
      balance: formData.balance,
    };

    const { data: updatedAccount, error } = await supabase
      .from("accounts")
      .update(updatedData)
      .eq("id", account.id)
      .select()
      .single();

    if (error) {
      console.error("Failed to update account:", error);
      toast({
        title: "Error",
        description: "Failed to update account",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    onAccountUpdated(updatedAccount);
    toast({
      title: "Account updated",
      description: `${formData.name} has been updated successfully.`,
    });
    onOpenChange(false);
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!account) return;

    const confirmDelete = confirm(
      `Are you sure you want to delete "${account.name}"? This action cannot be undone.`
    );
    if (!confirmDelete) return;

    setLoading(true);
    const { error } = await supabase
      .from("accounts")
      .delete()
      .eq("id", account.id);

    if (error) {
      console.error("Failed to delete account:", error);
      toast({
        title: "Error",
        description: "Failed to delete account",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    toast({
      title: "Account deleted",
      description: `${account.name} has been deleted.`,
    });

    onOpenChange(false);
    setLoading(false);
  };

  if (!account) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground">
            Edit Account
          </DialogTitle>
          <DialogDescription>
            Update the details of your account here.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Account Name</Label>
            <Input
              id="name"
              placeholder="e.g., Main Bank Account"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="bg-background border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Account Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value) =>
                setFormData({ ...formData, type: value })
              }
            >
              <SelectTrigger id="type" className="bg-background border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border z-50">
                {accountTypeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="balance">Balance</Label>
            <Input
              id="balance"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.balance}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  balance: parseFloat(e.target.value) || 0,
                })
              }
              className="bg-background border-border"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              Delete
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
