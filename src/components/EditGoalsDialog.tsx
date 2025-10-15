"use client";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGoals } from "@/hooks/useGoals";
import { useToast } from "@/hooks/use-toast";
import { Goal } from "@/types";

interface EditGoalsDialogProps {
  goal: Goal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGoalUpdated?: (updatedGoal: Goal) => void;
}

export function EditGoalsDialog({ goal, open, onOpenChange, onGoalUpdated }: EditGoalsDialogProps) {
  const { updateGoal } = useGoals();
  const { toast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    target_amount: "",
    current_amount: "",
    target_date: "",
    status: "active" as Goal["status"],
  });

  useEffect(() => {
    if (goal) {
      setFormData({
        name: goal.name || "",
        target_amount: String(goal.target_amount ?? ""),
        current_amount: String(goal.current_amount ?? ""),
        target_date: goal.target_date ? goal.target_date.slice(0, 10) : "",
        status: goal.status || "active",
      });
    }
  }, [goal]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal) return;

    setIsSubmitting(true);
    try {
      const updated = await updateGoal(goal.id, {
        name: formData.name,
        target_amount: parseFloat(formData.target_amount || "0"),
        current_amount: parseFloat(formData.current_amount || "0"),
        target_date: formData.target_date || null,
        status: formData.status,
      } as Partial<Goal>);

      if (onGoalUpdated && updated) onGoalUpdated(updated);

      toast({
        title: "Goal updated",
        description: "Your goal changes have been saved.",
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating goal", error);
      toast({
        title: "Error",
        description: "Failed to update goal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!goal) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Savings Goal</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Goal Name</Label>
            <Input
              id="name"
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
                value={formData.target_amount}
                onChange={(e) => handleInputChange("target_amount", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="current_amount">Current Amount</Label>
              <Input
                id="current_amount"
                type="number"
                value={formData.current_amount}
                onChange={(e) => handleInputChange("current_amount", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="target_date">Target Date</Label>
              <Input
                id="target_date"
                type="date"
                value={formData.target_date}
                onChange={(e) => handleInputChange("target_date", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange("status", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default EditGoalsDialog;


