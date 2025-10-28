"use client";
import { useState } from "react";
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
import { useGoals } from "@/hooks/useGoals";
import { useToast } from "@/hooks/use-toast";
import {
  Plane,
  Home,
  GraduationCap,
  Car,
  Heart,
  Gamepad2,
  Camera,
  Laptop,
  Smartphone,
  Briefcase,
} from "lucide-react";

interface AddGoalDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddGoalDialog({ isOpen, onClose }: AddGoalDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    target_amount: "",
    current_amount: "",
    target_date: "",
    auto_saving_amount: "",
    auto_saving_frequency: "none",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { createGoal } = useGoals();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await createGoal({
        name: formData.name,
        target_amount: parseFloat(formData.target_amount),
        current_amount: parseFloat(formData.current_amount) || 0,
        target_date: formData.target_date || undefined,
        auto_saving_amount: parseFloat(formData.auto_saving_amount) || 0,
        auto_saving_frequency: formData.auto_saving_frequency,
        next_auto_saving_date:
          formData.auto_saving_frequency === "none"
            ? null
            : new Date().toISOString().slice(0, 10),
        status: "active",
      });

      toast({
        title: "Goal created successfully!",
        description:
          formData.auto_saving_frequency === "none"
            ? "Your goal has been created."
            : "Goal created with auto saving enabled.",
      });

      onClose();
      setFormData({
        name: "",
        target_amount: "",
        current_amount: "",
        target_date: "",
        auto_saving_amount: "",
        auto_saving_frequency: "none",
      });
    } catch (error) {
      console.error("Error creating goal:", error);
      toast({
        title: "Error creating goal",
        description: "There was an error creating your goal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Savings Goal</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* --- Existing Fields --- */}
          <div className="space-y-2">
            <Label htmlFor="name">Goal Name</Label>
            <Input
              id="name"
              placeholder="e.g., Vacation to Japan"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="target_amount">Target Amount</Label>
              <Input
                id="target_amount"
                type="number"
                placeholder="5000"
                value={formData.target_amount}
                onChange={(e) =>
                  handleInputChange("target_amount", e.target.value)
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="current_amount">Current Amount</Label>
              <Input
                id="current_amount"
                type="number"
                placeholder="0"
                value={formData.current_amount}
                onChange={(e) =>
                  handleInputChange("current_amount", e.target.value)
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="target_date">Target Date (Optional)</Label>
            <Input
              id="target_date"
              type="date"
              value={formData.target_date}
              onChange={(e) => handleInputChange("target_date", e.target.value)}
            />
          </div>

          {/* --- NEW SECTION: Auto Saving --- */}
          <div className="border-t pt-4 space-y-2">
            <Label className="font-semibold">Auto Saving</Label>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="auto_saving_amount">Amount</Label>
                <Input
                  id="auto_saving_amount"
                  type="number"
                  placeholder="100"
                  value={formData.auto_saving_amount}
                  onChange={(e) =>
                    handleInputChange("auto_saving_amount", e.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="auto_saving_frequency">Frequency</Label>
                <Select
                  value={formData.auto_saving_frequency}
                  onValueChange={(v) =>
                    handleInputChange("auto_saving_frequency", v)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Goal"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
