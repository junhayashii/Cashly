import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";

import { Account } from "@/types";

interface AddAccountDialogProps {
  onAddAccount: (account: Account) => void;
}

export function AddAccountDialog({ onAddAccount }: AddAccountDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState<{
    name: string;
    type: "bank" | "credit_card" | "cash" | "e_wallet" | "investment";
    balance: number;
    credit_limit: number;
    // icon: string;
    // color: string;
  }>({
    name: "",
    type: "bank",
    balance: 0,
    credit_limit: 0,
    // icon: "CreditCard",
    // color: "#4ECDC4",
  });

  const iconOptions = [
    { value: "CreditCard", label: "Credit Card" },
    { value: "Wallet", label: "Wallet" },
    { value: "Banknote", label: "Bank" },
    { value: "Coins", label: "Coins" },
    { value: "Smartphone", label: "Digital Wallet" },
    { value: "PiggyBank", label: "Savings" },
  ];

  const colorOptions = [
    { value: "#4ECDC4", label: "Teal" },
    { value: "#45B7D1", label: "Blue" },
    { value: "#FF6B6B", label: "Red" },
    { value: "#96CEB4", label: "Green" },
    { value: "#FFEAA7", label: "Yellow" },
    { value: "#DDA0DD", label: "Purple" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    if (!formData.name) {
      toast({
        title: "Missing fields",
        description: "Please fill in the account name",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      if (userError) throw userError;

      const userId = userData?.user?.id;
      if (!userId) throw new Error("User not found");

      const account = {
        name: formData.name,
        type: formData.type,
        balance: formData.balance,
        user_id: userId,
        credit_limit:
          formData.type === "credit_card" ? formData.credit_limit : null,
        //   icon: formData.icon,
        //   color: formData.color,
      };

      console.log("Attempting to insert account:", account);

      const { data: insertedData, error } = await supabase
        .from("accounts")
        .insert([account])
        .select();

      if (error || !insertedData || insertedData.length === 0) {
        throw error || new Error("Failed to save account");
      }

      console.log("Inserted account data:", insertedData[0]);

      onAddAccount(insertedData[0]);
      toast({
        title: "Account added",
        description: `${formData.name} account has been created`,
      });

      setFormData({
        name: "",
        type: "bank",
        balance: 0,
        credit_limit: 0,
        //   icon: "CreditCard",
        //   color: "#4ECDC4",
      });
      setOpen(false);
    } catch (error) {
      console.error("Failed to insert account:", error);
      const message =
        error instanceof Error ? error.message : "Failed to save account";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const trigger = (
    <DialogTrigger asChild>
      <Button className="gap-2 sm:gap-2 h-12 sm:h-10 w-12 sm:w-auto rounded-full sm:rounded-md px-0 sm:px-4">
        <Plus className="h-5 w-5" />
        <span className="hidden sm:inline">New Account</span>
      </Button>
    </DialogTrigger>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger}
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground">
            Add Account
          </DialogTitle>
          <DialogDescription>
            Add the details of your account here.
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
                setFormData({
                  ...formData,
                  type: value as
                    | "bank"
                    | "credit_card"
                    | "cash"
                    | "e_wallet"
                    | "investment",
                })
              }
            >
              <SelectTrigger id="type" className="bg-background border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border z-50">
                <SelectItem value="bank">Bank</SelectItem>
                <SelectItem value="credit_card">Credit Card</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="e_wallet">Digital Wallet</SelectItem>
                <SelectItem value="investment">Investment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="balance">Initial Balance</Label>
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

          {/* クレカの場合のみ上限を表示 */}
          {formData.type === "credit_card" && (
            <div className="space-y-2">
              <Label htmlFor="credit_limit">Credit Limit</Label>
              <Input
                id="credit_limit"
                type="number"
                step="0.01"
                placeholder="e.g., 5000.00"
                value={formData.credit_limit}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    credit_limit: parseFloat(e.target.value) || 0,
                  })
                }
                className="bg-background border-border"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* <div className="space-y-2">
              <Label htmlFor="icon">Icon</Label>
              <Select
                value={formData.icon}
                onValueChange={(value) =>
                  setFormData({ ...formData, icon: value })
                }
              >
                <SelectTrigger
                  id="icon"
                  className="bg-background border-border"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border z-50">
                  {iconOptions.map((icon) => (
                    <SelectItem key={icon.value} value={icon.value}>
                      {icon.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div> */}

            {/* <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Select
                value={formData.color}
                onValueChange={(value) =>
                  setFormData({ ...formData, color: value })
                }
              >
                <SelectTrigger
                  id="color"
                  className="bg-background border-border"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border z-50">
                  {colorOptions.map((color) => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: color.value }}
                        />
                        {color.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div> */}
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? "Adding..." : "Add Account"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
