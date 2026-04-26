import { AlertCircle } from "lucide-react";

interface DeleteModalProps {
  title: string;
  description: string;
  submitText: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteModal({ title, description, submitText, onCancel, onConfirm }: DeleteModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl dark:bg-[#1C1C1C] border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="p-6 md:p-8">
          <div className="flex gap-4 mb-3">
             <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/50">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-500" />
             </div>
             <div>
               <h2 className="text-xl font-bold text-zinc-900 dark:text-white">{title}</h2>
               <p className="mt-2 text-[15px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                 {description}
               </p>
             </div>
          </div>
          
          <div className="mt-8 flex items-center justify-end gap-3">
            <button
              onClick={onCancel}
              className="rounded-xl px-5 py-2.5 text-[14px] font-semibold text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 transition"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="rounded-xl bg-white px-5 py-2.5 text-[14px] font-semibold text-black shadow-sm hover:bg-zinc-100 transition border border-zinc-200 dark:border-transparent dark:bg-white dark:hover:bg-zinc-200"
            >
              {submitText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
