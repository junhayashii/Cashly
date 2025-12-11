"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabaseClient";
import type { Account } from "@/types";

/**
 * Server action to get accounts for a user
 */
export async function getAccounts(userId: string) {
  try {
    const { data: accounts, error } = await supabase
      .from("accounts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return { success: true, data: accounts };
  } catch (error) {
    console.error("Error fetching accounts:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch accounts",
      data: []
    };
  }
}

/**
 * Server action to create a new account
 */
export async function createAccount(data: Omit<Account, "id" | "created_at" | "updated_at">) {
  try {
    const { data: account, error } = await supabase
      .from("accounts")
      .insert([data])
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/accounts");
    revalidatePath("/dashboard");
    
    return { success: true, data: account };
  } catch (error) {
    console.error("Error creating account:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to create account" 
    };
  }
}

/**
 * Server action to update an account
 */
export async function updateAccount(id: string, data: Partial<Account>) {
  try {
    const { data: account, error } = await supabase
      .from("accounts")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/accounts");
    revalidatePath("/dashboard");
    
    return { success: true, data: account };
  } catch (error) {
    console.error("Error updating account:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to update account" 
    };
  }
}

/**
 * Server action to delete an account
 */
export async function deleteAccount(id: string) {
  try {
    const { error } = await supabase
      .from("accounts")
      .delete()
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/accounts");
    revalidatePath("/dashboard");
    
    return { success: true };
  } catch (error) {
    console.error("Error deleting account:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to delete account" 
    };
  }
}
