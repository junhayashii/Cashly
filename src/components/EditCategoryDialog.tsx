import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
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

import { Category } from "@/types";
import { supabase } from "@/lib/supabaseClient";

interface EditCategoryDialogProps {
  category: Category | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCategoryUpdated: (updatedCategory: Category) => void;
}

export function EditCategoryDialog({
  category,
  open,
  onOpenChange,
  onCategoryUpdated,
}: EditCategoryDialogProps) {
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

  // Update form data when category changes
  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        type: category.type,
        icon: category.icon || "ShoppingCart",
        color: category.color || "#FF6B6B",
        monthly_budget: category.monthly_budget || 0,
      });
    }
  }, [category]);

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
    if (loading || !category) return;
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

    const updatedData = {
      name: formData.name,
      type: formData.type,
      icon: formData.icon,
      color: formData.color,
      monthly_budget: formData.monthly_budget,
    };

    console.log("Attempting to update category:", updatedData);

    const { data: updatedCategory, error } = await supabase
      .from("categories")
      .update(updatedData)
      .eq("id", category.id)
      .select()
      .single();

    if (error) {
      console.error("Failed to update category:", error);
      toast({
        title: "Error",
        description: "Failed to update category",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    console.log("Updated category data:", updatedCategory);

    onCategoryUpdated(updatedCategory);
    toast({
      title: "Category updated",
      description: `${formData.name} has been updated successfully`,
    });

    onOpenChange(false);
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!category) return;

    const confirmDelete = confirm(
      `Are you sure you want to delete "${category.name}"? This action cannot be undone.`
    );

    if (!confirmDelete) return;

    setLoading(true);

    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", category.id);

    if (error) {
      console.error("Failed to delete category:", error);
      toast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    toast({
      title: "Category deleted",
      description: `${category.name} has been deleted`,
    });

    onOpenChange(false);
    setLoading(false);
  };

  if (!category) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground">
            Edit Category
          </DialogTitle>
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
