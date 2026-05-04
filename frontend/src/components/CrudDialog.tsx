import { ReactNode } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface CrudDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  onSave: () => void;
  saveLabel?: string;
  variant?: "default" | "destructive";
}

const CrudDialog = ({ open, onOpenChange, title, description, children, onSave, saveLabel = "Salvar", variant = "default" }: CrudDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col p-0 gap-0">
      <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50 shrink-0">
        <DialogTitle className="font-serif">{title}</DialogTitle>
        {description && <DialogDescription>{description}</DialogDescription>}
      </DialogHeader>
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">{children}</div>
      <DialogFooter className="px-6 py-4 border-t border-border/50 shrink-0 bg-background">
        <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
        <Button variant={variant} onClick={() => { onSave(); onOpenChange(false); }}>{saveLabel}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export default CrudDialog;
