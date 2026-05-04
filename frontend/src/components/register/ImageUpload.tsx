import { useRef } from "react";
import { Camera, X } from "lucide-react";
import { Label } from "@/components/ui/label";

interface ImageUploadProps {
  label: string;
  preview: string | null;
  onChange: (file: File | null) => void;
  icon: React.ReactNode;
  shape?: "rounded" | "circle";
}

const ImageUpload = ({ label, preview, onChange, icon, shape = "rounded" }: ImageUploadProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onChange(file);
  };

  const shapeClass = shape === "circle" ? "rounded-full" : "rounded-xl";

  return (
    <div className="flex flex-col items-center gap-2">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="relative group">
        <div
          onClick={() => inputRef.current?.click()}
          className={`w-20 h-20 ${shapeClass} border-2 border-dashed border-primary/20 group-hover:border-primary/50 flex items-center justify-center cursor-pointer overflow-hidden transition-all duration-300 bg-primary/5 group-hover:bg-primary/10 group-hover:shadow-lg group-hover:shadow-primary/10`}
        >
          {preview ? (
            <img src={preview} alt="Preview" className={`w-full h-full object-cover`} />
          ) : (
            <div className="flex flex-col items-center gap-1.5 text-muted-foreground group-hover:text-primary transition-colors">
              {icon}
              <div className="flex items-center gap-0.5 text-[10px] font-medium">
                <Camera className="h-3 w-3" />
                <span>Enviar</span>
              </div>
            </div>
          )}
        </div>
        {preview && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange(null); }}
            className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
};

export default ImageUpload;
