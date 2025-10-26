"use client";

import { useState, DragEvent } from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { Upload } from "lucide-react";
import { useAccounts } from "@/hooks/useAccounts";

export function ImportTransactionsDialog() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();
  const { accounts } = useAccounts();

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      setFile(files[0]);
    }
  };

  const detectPaymentMethod = (
    desc: string
  ): "credito" | "debito" | "cash" | "pix" | "transfer" => {
    const d = desc.toLowerCase();

    if (d.includes("pix")) return "pix";
    if (d.includes("debito") || d.includes("débito")) return "debito";
    if (
      d.includes("credito") ||
      d.includes("crédito") ||
      d.includes("cartao") ||
      d.includes("cartão")
    )
      return "credito";
    if (
      d.includes("transfer") ||
      d.includes("transferência") ||
      d.includes("transferencia")
    )
      return "transfer";
    if (d.includes("dinheiro") || d.includes("cash")) return "cash";

    return "cash"; // fallback safe value
  };

  const handleImport = async () => {
    if (!file) {
      toast({ title: "No file selected", variant: "destructive" });
      return;
    }
    if (!accountId) {
      toast({ title: "Select an account", variant: "destructive" });
      return;
    }

    setLoading(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      delimiter: "", // 自動判別
      complete: async (results) => {
        const raw = results.data as Record<string, string>[];

        console.log("Parsed CSV (raw):", raw.slice(0, 5));

        const {
          data: { user },
        } = await supabase.auth.getUser();

        // フィールド名を正規化（アクセント・大文字小文字無視）
        const normalizeKey = (key: string) =>
          key
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim()
            .toLowerCase();

        // CSV行を正規化して transactions 構造に変換
        const mapped = raw
          .map((r) => {
            const keys = Object.keys(r).reduce((acc, key) => {
              acc[normalizeKey(key)] = r[key];
              return acc;
            }, {} as Record<string, string>);

            const dataStr =
              keys["data"] ||
              keys["data lancamento"] ||
              keys["date"] ||
              keys["transaction date"];

            const valorStr = keys["valor"] || keys["amount"];
            const descStr =
              keys["descricao"] ||
              keys["descrição"] ||
              keys["historico"] ||
              keys["description"] ||
              "";

            if (!dataStr || !valorStr) return null;

            const valor = parseFloat(
              valorStr.replace(/\./g, "").replace(",", ".").trim()
            );

            const [day, month, year] = dataStr.split("/");
            const date =
              day && month && year
                ? `${year}-${month}-${day}`
                : new Date().toISOString();

            return {
              title: descStr.trim() || "Sem descrição",
              amount: valor,
              date,
              category_id: null,
              account_id: accountId,
              type: valor > 0 ? "income" : "expense",
              payment_method: detectPaymentMethod(descStr),
              user_id: user?.id,
            };
          })
          // ✅ nullを型的に除外（TypeScriptエラー回避）
          .filter((t): t is NonNullable<typeof t> => t !== null);

        console.log("Mapped transactions (normalized):", mapped);

        // ✅ Supabase用に安全クリーニング
        const cleaned = mapped.map((t) => ({
          title: t.title,
          amount: t.amount,
          date: new Date(t.date).toISOString(),
          category_id: t.category_id ?? null,
          account_id: t.account_id,
          type: t.type,
          payment_method: t.payment_method,
          user_id: t.user_id,
        }));

        console.log("Cleaned transactions before insert:", cleaned);

        if (cleaned.length === 0) {
          toast({
            title: "No valid rows",
            description:
              "The file was parsed, but no valid transaction data was found.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("transactions")
          .insert(cleaned)
          .select();

        console.log("Insert result:", { data, error });

        if (error) {
          console.error("Supabase insert error:", error);
          toast({
            title: "Import failed",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Transactions imported",
            description: `${cleaned.length} transactions added successfully`,
          });
          setOpen(false);
        }

        setLoading(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Upload className="h-4 w-4" />
          Import
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-card border-border sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Import Transactions</DialogTitle>
        </DialogHeader>

        {/* ドラッグ&ドロップ */}
        <div
          className={`mt-3 p-6 border-2 border-dashed rounded-xl text-center transition-all ${
            dragActive
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/20 hover:border-primary/50"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
        >
          <p className="text-muted-foreground mb-2">
            Drag & Drop your <b>CSV</b> file here
          </p>
          <p className="text-sm text-muted-foreground mb-3">or</p>
          <Input
            type="file"
            accept=".csv"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          {file && (
            <p className="mt-2 text-sm text-foreground font-medium">
              📄 {file.name}
            </p>
          )}
        </div>

        {/* アカウント選択 */}
        <div className="mt-4 space-y-2">
          <Label>Select Account</Label>
          <Select
            value={accountId || ""}
            onValueChange={(v) => setAccountId(v)}
          >
            <SelectTrigger className="bg-background border-border">
              <SelectValue placeholder="Choose account" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {accounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* ボタン */}
        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleImport}
            disabled={loading || !file}
            className="flex-1"
          >
            {loading ? "Importing..." : "Import"}
          </Button>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
