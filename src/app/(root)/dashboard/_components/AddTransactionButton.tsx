"use client";

import { Button } from "@/components/ui/button";
import { AddTransactionDialog } from "@/components/AddTransactionDialog";
import { Plus } from "lucide-react";
import type { Transaction } from "@/types";

export function AddTransactionButton() {
  const handleAddTransaction = (transaction: Transaction) => {
    // Transaction added, page will revalidate automatically via server action
    console.log("Transaction added:", transaction);
  };

  return (
    <AddTransactionDialog 
      onAddTransaction={handleAddTransaction}
      trigger={
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Transaction
        </Button>
      }
    />
  );
}
