import { useRef, useState } from "react";
import type { ChangeEvent, ClipboardEvent } from "react";
import { compressImage } from "../../utils/imageCompress";
import { useAutoGrow } from "../../hooks/useAutoGrow";
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useAutoGrow(textareaRef, value);

  async function addFiles(files: File[]) {
    if (files.length === 0) return;
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
      setPasteError("Não foi possível processar a imagem.");
    } finally {
      setProcessing(false);
    }
  }

  async function handlePaste(e: ClipboardEvent<HTMLTextAreaElement>) {
    const files = Array.from(e.clipboardData.items)
      .filter((item) => item.type.startsWith("image/"))
      .map((item) => item.getAsFile())
      .filter((file): file is File => Boolean(file));
    if (files.length === 0) return;
    e.preventDefault();
    await addFiles(files);
  }

  function handlePick(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    void addFiles(files);
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
        ref={textareaRef}
        className={styles.textarea}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onPaste={handlePaste}
        placeholder={placeholder}
        rows={1}
        maxLength={10000}
        autoFocus={autoFocus}
      />
      <div className={styles.tools}>
        <button
          type="button"
          className={styles.addImage}
          onClick={() => fileInputRef.current?.click()}
          disabled={images.length >= MAX_IMAGES}
        >
          ＋ Adicionar imagem
        </button>
        <span className={styles.hint}>ou cole (Ctrl+V)</span>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={handlePick}
      />
      {processing && <span className={styles.hint}>Processando imagem…</span>}
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
