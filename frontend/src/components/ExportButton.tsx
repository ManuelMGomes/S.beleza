import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileText, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";

interface ExportButtonProps {
  onExportCSV: () => void;
  onExportPDF: () => void;
}

const ExportButton = ({ onExportCSV, onExportPDF }: ExportButtonProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="shadow-sm gap-2">
          <Download className="h-4 w-4" />
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => { onExportCSV(); toast.success("Relatório CSV exportado!"); }} className="gap-2 cursor-pointer">
          <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
          Exportar CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => { onExportPDF(); toast.success("Relatório PDF gerado!"); }} className="gap-2 cursor-pointer">
          <FileText className="h-4 w-4 text-primary" />
          Exportar PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ExportButton;
