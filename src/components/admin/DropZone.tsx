import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { uploadImage } from "@/lib/store";
import { toast } from "sonner";

export function DropZone({ images, onChange, multiple = true }: { images: string[]; onChange: (imgs: string[]) => void; multiple?: boolean }) {
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const handle = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    try {
      const list = [...files].filter((f) => f.type.startsWith("image/"));
      const urls = await Promise.all(list.map(uploadImage));
      onChange(multiple ? [...images, ...urls] : urls.slice(0, 1));
    } catch (e) {
      toast.error((e as Error).message);
    }
    setBusy(false);
  };

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); handle(e.dataTransfer.files); }}
        onClick={() => input.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed p-6 text-sm transition ${over ? "border-primary bg-primary/5" : "border-border bg-muted/40"}`}
      >
        {busy ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : <ImagePlus className="h-6 w-6 text-muted-foreground" />}
        <span className="text-muted-foreground">{busy ? "Subiendo…" : `Arrastra ${multiple ? "imágenes" : "una imagen"} o haz clic`}</span>
        <input ref={input} type="file" accept="image/*" multiple={multiple} hidden onChange={(e) => handle(e.target.files)} />
      </div>
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((src, i) => (
            <div key={src + i} className="relative">
              <img src={src} alt="" className="h-20 w-20 rounded-xl object-cover" />
              <button type="button" onClick={() => onChange(images.filter((_, k) => k !== i))}
                className="absolute -right-1.5 -top-1.5 rounded-full bg-destructive p-0.5 text-destructive-foreground" aria-label="Quitar">
                <X className="h-3 w-3" />
              </button>
              {i === 0 && multiple && <span className="absolute bottom-1 left-1 rounded bg-background/90 px-1 text-[10px]">Principal</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
