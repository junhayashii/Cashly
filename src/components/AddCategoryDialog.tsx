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

import { Category } from "@/types";
import { supabase } from "@/lib/supabaseClient";

interface AddCategoryDialogProps {
  onAddCategory: (category: Category) => void;
}

export function AddCategoryDialog({ onAddCategory }: AddCategoryDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState<{
    name: string;
    type: "income" | "expense";
    icon: string;
    color: string;
    monthly_budget: number;
  }>({
    name: "",
    type: "expense",
    icon: "ShoppingCart",
    color: "#FF6B6B",
    monthly_budget: 0,
  });

  const iconOptions = [
    { value: "ShoppingCart", label: "Shopping Cart" },
    { value: "Home", label: "Home" },
    { value: "Car", label: "Car" },
    { value: "Coffee", label: "Coffee" },
    { value: "Plane", label: "Plane" },
    { value: "Heart", label: "Heart" },
    { value: "Zap", label: "Zap" },
    { value: "DollarSign", label: "Dollar Sign" },
    { value: "TrendingUp", label: "Trending Up" },
    { value: "TrendingDown", label: "Trending Down" },
  ];

  const colorOptions = [
    { value: "#FF6B6B", label: "Red" },
    { value: "#4ECDC4", label: "Teal" },
    { value: "#45B7D1", label: "Blue" },
    { value: "#96CEB4", label: "Green" },
    { value: "#FFEAA7", label: "Yellow" },
    { value: "#DDA0DD", label: "Purple" },
    { value: "#98D8C8", label: "Mint" },
    { value: "#F7DC6F", label: "Orange" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    if (!formData.name) {
      toast({
        title: "Missing fields",
        description: "Please fill in the category name",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const userId = userData?.user?.id;
      if (!userId) throw new Error("User not found");

      const category = {
        name: formData.name,
        type: formData.type,
        icon: formData.icon,
        color: formData.color,
        monthly_budget: formData.monthly_budget,
        user_id: userId,
      };

      console.log("Attempting to insert category:", category);

      const { data: insertedData, error } = await supabase
        .from("categories")
        .insert([category])
        .select();

      if (error || !insertedData || insertedData.length === 0) {
        throw error || new Error("Failed to save category");
      }

      console.log("Inserted category data:", insertedData[0]);

      onAddCategory(insertedData[0]);
      toast({
        title: "Category added",
        description: `${formData.name} category has been created`,
      });

      setFormData({
        name: "",
        type: "expense",
        icon: "ShoppingCart",
        color: "#FF6B6B",
        monthly_budget: 0,
      });
      setOpen(false);
    } catch (error) {
      console.error("Failed to insert category:", error);
      const message =
        error instanceof Error ? error.message : "Failed to save category";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Category
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground">
            Add Category
          </DialogTitle>
          <DialogDescription>
            Add the details of your category here.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Category Name</Label>
            <Input
              id="name"
              placeholder="e.g., Groceries"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="bg-background border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Category Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  type: value as "income" | "expense",
                })
              }
            >
              <SelectTrigger id="type" className="bg-background border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border z-50">
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="income">Income</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="budget">Monthly Budget</Label>
            <Input
              id="budget"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={formData.monthly_budget}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  monthly_budget: parseFloat(e.target.value) || 0,
                })
              }
              className="bg-background border-border"
            />
            <p className="text-xs text-muted-foreground">
              Set to 0 for income categories or unlimited budget
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
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
            </div>

            <div className="space-y-2">
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
            </div>
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
              {loading ? "Adding..." : "Add Category"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
