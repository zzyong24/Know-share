"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/*
  COMP-025 ConfirmDialog（破坏性二次确认）。AlertDialog 语义：alertdialog/aria-modal/焦点陷入/Esc 取消。
  打开时焦点落在取消（安全默认，由 shadcn AlertDialogCancel 顺序保证）。
  requireTyping：高危需输入确认词，未匹配时确认禁用。danger 文字说明后果。
*/
export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "danger" | "default";
  requireTyping?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  onOpenChange: (open: boolean) => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "取消",
  tone = "default",
  requireTyping,
  loading = false,
  onConfirm,
  onCancel,
  onOpenChange,
}: ConfirmDialogProps) {
  const [typed, setTyped] = useState("");
  const typingOk = !requireTyping || typed === requireTyping;
  const confirmDisabled = !typingOk || loading;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {requireTyping && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirm-typing">
              请输入 <span className="font-mono font-semibold">{requireTyping}</span> 以确认
            </Label>
            <Input
              id="confirm-typing"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
            />
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            disabled={confirmDisabled}
            aria-disabled={confirmDisabled}
            onClick={confirmDisabled ? (e) => e.preventDefault() : onConfirm}
            className={cn(
              tone === "danger" && "bg-danger text-white hover:bg-danger/90"
            )}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
