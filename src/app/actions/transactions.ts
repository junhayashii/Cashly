"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabaseClient";
import type { Transaction } from "@/types";

/**
 * Server action to create a new transaction
 */
export async function createTransaction(data: Omit<Transaction, "id">) {
  try {
    const { data: transaction, error } = await supabase
      .from("transactions")
      .insert([data])
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/dashboard");
    revalidatePath("/transactions");
    
    return { success: true, data: transaction };
  } catch (error) {
    console.error("Error creating transaction:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to create transaction" 
    };
  }
}

/**
 * Server action to update a transaction
 */
export async function updateTransaction(id: string, data: Partial<Transaction>) {
  try {
    const { data: transaction, error } = await supabase
      .from("transactions")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/dashboard");
    revalidatePath("/transactions");
    
    return { success: true, data: transaction };
  } catch (error) {
    console.error("Error updating transaction:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to update transaction" 
    };
  }
}

/**
 * Server action to delete a transaction
 */
export async function deleteTransaction(id: string) {
  try {
    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/dashboard");
    revalidatePath("/transactions");
    
    return { success: true };
  } catch (error) {
    console.error("Error deleting transaction:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to delete transaction" 
    };
  }
}

/**
 * Server action to get transactions for a user
 */
export async function getTransactions(userId: string) {
  try {
    const { data: transactions, error } = await supabase
      .from("transactions")
      .select(`
        *,
        category:categories(*)
      `)
      .eq("user_id", userId)
      .order("date", { ascending: false });

    if (error) throw error;

    return { success: true, data: transactions };
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch transactions",
      data: []
    };
  }
}
