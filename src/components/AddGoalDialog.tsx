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

const goalIcons = [
  { value: "plane", label: "Vacation", icon: Plane },
  { value: "home", label: "House", icon: Home },
  { value: "graduation", label: "Education", icon: GraduationCap },
  { value: "car", label: "Car", icon: Car },
  { value: "heart", label: "Wedding", icon: Heart },
  { value: "gamepad", label: "Gaming", icon: Gamepad2 },
  { value: "camera", label: "Photography", icon: Camera },
  { value: "laptop", label: "Technology", icon: Laptop },
  { value: "smartphone", label: "Phone", icon: Smartphone },
  { value: "briefcase", label: "Business", icon: Briefcase },
];

const goalColors = [
  { value: "text-blue-600", label: "Blue" },
  { value: "text-green-600", label: "Green" },
  { value: "text-purple-600", label: "Purple" },
  { value: "text-red-600", label: "Red" },
  { value: "text-orange-600", label: "Orange" },
  { value: "text-pink-600", label: "Pink" },
  { value: "text-indigo-600", label: "Indigo" },
  { value: "text-teal-600", label: "Teal" },
];

export function AddGoalDialog({ isOpen, onClose }: AddGoalDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    target_amount: "",
    current_amount: "",
    target_date: "",
    icon: "plane",
    color: "blue",
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
        status: "active",
      });

      toast({
        title: "Goal created successfully!",
        description: "Your new savings goal has been added.",
      });

      onClose();
      // Reset form
      setFormData({
        name: "",
        target_amount: "",
        current_amount: "",
        target_date: "",
        icon: "plane",
        color: "blue",
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

  const selectedIcon = goalIcons.find((icon) => icon.value === formData.icon);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Savings Goal</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
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

          <div className="space-y-2">
            <Label>Icon</Label>
            <Select
              value={formData.icon}
              onValueChange={(value) => handleInputChange("icon", value)}
            >
              <SelectTrigger>
                <SelectValue>
                  {selectedIcon && (
                    <div className="flex items-center gap-2">
                      <selectedIcon.icon className="h-4 w-4" />
                      {selectedIcon.label}
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {goalIcons.map((icon) => (
                  <SelectItem key={icon.value} value={icon.value}>
                    <div className="flex items-center gap-2">
                      <icon.icon className="h-4 w-4" />
                      {icon.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Color Theme</Label>
            <Select
              value={formData.color}
              onValueChange={(value) => handleInputChange("color", value)}
            >
              <SelectTrigger>
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-4 h-4 rounded-full bg-${formData.color}-600`}
                    />
                    {
                      goalColors.find(
                        (c) => c.value === `text-${formData.color}-600`
                      )?.label
                    }
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {goalColors.map((color) => {
                  const colorKey = color.value
                    .replace("text-", "")
                    .replace("-600", "");
                  return (
                    <SelectItem key={color.value} value={colorKey}>
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded-full bg-${colorKey}-600`}
                        />
                        {color.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

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
