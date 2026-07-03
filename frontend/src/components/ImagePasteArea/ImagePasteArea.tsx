import { useState } from "react";
import type { ClipboardEvent } from "react";
import { compressImage } from "../../utils/imageCompress";
import styles from "./ImagePasteArea.module.css";

const MAX_IMAGES = 6;

interface ImagePasteAreaProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  images: string[];
  onImagesChange: (images: string[]) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function ImagePasteArea({
  id,
  label,
  value,
  onChange,
  images,
  onImagesChange,
  placeholder,
  autoFocus,
}: ImagePasteAreaProps) {
  const [processing, setProcessing] = useState(false);
  const [pasteError, setPasteError] = useState<string | null>(null);

  async function handlePaste(e: ClipboardEvent<HTMLTextAreaElement>) {
    const files = Array.from(e.clipboardData.items)
      .filter((item) => item.type.startsWith("image/"))
      .map((item) => item.getAsFile())
      .filter((file): file is File => Boolean(file));
    if (files.length === 0) return;

    e.preventDefault();
    setPasteError(null);

    const available = MAX_IMAGES - images.length;
    if (available <= 0) {
      setPasteError(`No máximo ${MAX_IMAGES} imagens por campo.`);
      return;
    }

    setProcessing(true);
    try {
      const compressed = await Promise.all(files.slice(0, available).map(compressImage));
      onImagesChange([...images, ...compressed]);
      if (files.length > available) {
        setPasteError(`No máximo ${MAX_IMAGES} imagens por campo.`);
      }
    } catch {
      setPasteError("Não foi possível processar a imagem colada.");
    } finally {
      setProcessing(false);
    }
  }

  function removeImage(index: number) {
    setPasteError(null);
    onImagesChange(images.filter((_, i) => i !== index));
  }

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      <textarea
        id={id}
        className={styles.textarea}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onPaste={handlePaste}
        placeholder={placeholder}
        rows={3}
        maxLength={10000}
        autoFocus={autoFocus}
      />
      <span className={styles.hint}>
        {processing ? "Processando imagem…" : "Cole imagens com Ctrl+V"}
      </span>
      {pasteError && <p className={styles.pasteError}>{pasteError}</p>}
      {images.length > 0 && (
        <div className={styles.thumbs}>
          {images.map((src, index) => (
            <div key={index} className={styles.thumb}>
              <img src={src} alt={`Imagem ${index + 1}`} className={styles.thumbImage} />
              <button
                type="button"
                className={styles.thumbRemove}
                onClick={() => removeImage(index)}
                aria-label={`Remover imagem ${index + 1}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
