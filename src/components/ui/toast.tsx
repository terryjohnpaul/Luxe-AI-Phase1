"use client";

import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils/cn";
import { Check, AlertTriangle, X, Undo2 } from "lucide-react";

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info";
  message: string;
  undoAction?: () => void;
  duration?: number;
}

interface ToastProviderProps {
  children: React.ReactNode;
}

let addToastGlobal: ((toast: Omit<ToastMessage, "id">) => void) | null = null;

export function showToast(toast: Omit<ToastMessage, "id">) {
  addToastGlobal?.(toast);
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((toast: Omit<ToastMessage, "id">) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    addToastGlobal = addToast;
    return () => {
      addToastGlobal = null;
    };
  }, [addToast]);

  return (
    <>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2" aria-live="polite">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={removeToast} />
        ))}
      </div>
    </>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, toast.duration || 4000);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  const Icon = toast.type === "success" ? Check : toast.type === "error" ? AlertTriangle : Check;

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg border min-w-[280px] animate-in slide-in-from-right",
        toast.type === "success" && "bg-green-50 border-green-200 text-green-800",
        toast.type === "error" && "bg-red-50 border-red-200 text-red-800",
        toast.type === "info" && "bg-blue-50 border-blue-200 text-blue-800"
      )}
      role="status"
    >
      <Icon size={14} className="shrink-0" />
      <span className="text-xs font-medium flex-1">{toast.message}</span>
      {toast.undoAction && (
        <button
          onClick={() => {
            toast.undoAction?.();
            onDismiss(toast.id);
          }}
          className="text-xs font-semibold underline flex items-center gap-1 hover:opacity-80"
          aria-label="Undo action"
        >
          <Undo2 size={12} /> Undo
        </button>
      )}
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-current opacity-50 hover:opacity-100"
        aria-label="Dismiss notification"
      >
        <X size={14} />
      </button>
    </div>
  );
}
