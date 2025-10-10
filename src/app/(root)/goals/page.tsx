"use client";
import { useState } from "react";
import { GoalsSection } from "@/components/GoalsSection";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { MetricCard } from "@/components/MetricCard";
import { AddGoalDialog } from "@/components/AddGoalDialog";
import { 
  Plus, 
  PiggyBank, 
  Target, 
  TrendingUp, 
  Calendar,
  DollarSign,
  Clock
} from "lucide-react";
import { goals } from "@/data/goals";
import ProtectedRoute from "@/components/ProtectedRoute";

const Goals = () => {
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);

  // Calculate total savings metrics
  const totalTarget = goals.reduce((sum, goal) => sum + goal.target, 0);
  const totalCurrent = goals.reduce((sum, goal) => sum + goal.current, 0);
  const totalProgress = (totalCurrent / totalTarget) * 100;
  const completedGoals = goals.filter(goal => goal.current >= goal.target).length;
  const activeGoals = goals.length - completedGoals;

  // Calculate average progress
  const averageProgress = goals.reduce((sum, goal) => {
    return sum + (goal.current / goal.target) * 100;
  }, 0) / goals.length;

  return (
    <ProtectedRoute>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">
              Savings & Goals
            </h2>
            <p className="text-muted-foreground">
              Track your financial goals and savings progress
            </p>
          </div>
          <Button 
            onClick={() => setIsAddGoalOpen(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            New Goal
          </Button>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Savings"
            value={`$${totalCurrent.toLocaleString()}`}
            change={`${totalProgress.toFixed(1)}% of target`}
            changeType="positive"
            icon={PiggyBank}
            iconColor="bg-green-500/10 text-green-600"
          />
          <MetricCard
            title="Target Amount"
            value={`$${totalTarget.toLocaleString()}`}
            change={`${activeGoals} active goals`}
            changeType="neutral"
            icon={Target}
            iconColor="bg-blue-500/10 text-blue-600"
          />
          <MetricCard
            title="Average Progress"
            value={`${averageProgress.toFixed(1)}%`}
            change={`${completedGoals} completed`}
            changeType="positive"
            icon={TrendingUp}
            iconColor="bg-purple-500/10 text-purple-600"
          />
          <MetricCard
            title="Remaining"
            value={`$${(totalTarget - totalCurrent).toLocaleString()}`}
            change="to reach all goals"
            changeType="neutral"
            icon={DollarSign}
            iconColor="bg-orange-500/10 text-orange-600"
          />
        </div>

        {/* Overall Progress Card */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-foreground">Overall Progress</h3>
              <p className="text-muted-foreground">
                Progress across all your savings goals
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-foreground">
                {totalProgress.toFixed(1)}%
              </p>
              <p className="text-sm text-muted-foreground">
                ${totalCurrent.toLocaleString()} of ${totalTarget.toLocaleString()}
              </p>
            </div>
          </div>
          <Progress value={totalProgress} className="h-3" />
        </Card>

        {/* Goals Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GoalsSection />
          
          {/* Quick Stats Card */}
          <Card className="p-6">
            <h3 className="text-xl font-bold text-foreground mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <Target className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="text-sm font-medium">Total Goals</span>
                </div>
                <span className="font-bold">{goals.length}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Clock className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium">Active Goals</span>
                </div>
                <span className="font-bold">{activeGoals}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <TrendingUp className="h-4 w-4 text-purple-600" />
                  </div>
                  <span className="text-sm font-medium">Completed</span>
                </div>
                <span className="font-bold">{completedGoals}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-500/10">
                    <Calendar className="h-4 w-4 text-orange-600" />
                  </div>
                  <span className="text-sm font-medium">Nearest Deadline</span>
                </div>
                <span className="font-bold text-sm">
                  {goals.length > 0 ? goals[0].deadline : "N/A"}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Add Goal Dialog */}
        <AddGoalDialog 
          isOpen={isAddGoalOpen} 
          onClose={() => setIsAddGoalOpen(false)} 
        />
      </div>
    </ProtectedRoute>
  );
};

export default Goals;
