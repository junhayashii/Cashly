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
  Briefcase
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
    title: "",
    target: "",
    current: "",
    deadline: "",
    icon: "plane",
    color: "text-blue-600",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically save the goal to your database
    console.log("New goal:", formData);
    onClose();
    // Reset form
    setFormData({
      title: "",
      target: "",
      current: "",
      deadline: "",
      icon: "plane",
      color: "text-blue-600",
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const selectedIcon = goalIcons.find(icon => icon.value === formData.icon);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Savings Goal</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Goal Title</Label>
            <Input
              id="title"
              placeholder="e.g., Vacation to Japan"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="target">Target Amount</Label>
              <Input
                id="target"
                type="number"
                placeholder="5000"
                value={formData.target}
                onChange={(e) => handleInputChange("target", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="current">Current Amount</Label>
              <Input
                id="current"
                type="number"
                placeholder="0"
                value={formData.current}
                onChange={(e) => handleInputChange("current", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deadline">Target Date</Label>
            <Input
              id="deadline"
              type="date"
              value={formData.deadline}
              onChange={(e) => handleInputChange("deadline", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Icon</Label>
            <Select value={formData.icon} onValueChange={(value) => handleInputChange("icon", value)}>
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
            <Select value={formData.color} onValueChange={(value) => handleInputChange("color", value)}>
              <SelectTrigger>
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full ${formData.color.replace('text-', 'bg-')}`} />
                    {goalColors.find(c => c.value === formData.color)?.label}
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {goalColors.map((color) => (
                  <SelectItem key={color.value} value={color.value}>
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full ${color.value.replace('text-', 'bg-')}`} />
                      {color.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Create Goal
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
