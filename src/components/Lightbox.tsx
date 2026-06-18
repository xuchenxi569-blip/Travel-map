import { useCallback, useEffect } from "react";
import type { PhotoItem } from "../lib/PhotoContext";

interface Props {
  photos: PhotoItem[];
  index: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export default function Lightbox({ photos, index, onClose, onNavigate }: Props) {
  const photo = photos[index];

  const prev = useCallback(() => {
    onNavigate((index - 1 + photos.length) % photos.length);
  }, [index, photos.length, onNavigate]);

  const next = useCallback(() => {
    onNavigate((index + 1) % photos.length);
  }, [index, photos.length, onNavigate]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, prev, next]);

  if (!photo) return null;

  return (
    <div className="lightbox" onClick={onClose}>
      <button className="lb-close" onClick={onClose} aria-label="关闭">
        ×
      </button>
      {photos.length > 1 && (
        <button
          className="lb-nav lb-prev"
          onClick={(e) => {
            e.stopPropagation();
            prev();
          }}
          aria-label="上一张"
        >
          ‹
        </button>
      )}
      <figure className="lb-figure" onClick={(e) => e.stopPropagation()}>
        <img src={photo.url} alt={photo.location ?? photo.provinceName} />
        <figcaption>
          <span className="lb-loc">{photo.location || photo.provinceName}</span>
          {photo.note && <span className="lb-note">{photo.note}</span>}
        </figcaption>
      </figure>
      {photos.length > 1 && (
        <button
          className="lb-nav lb-next"
          onClick={(e) => {
            e.stopPropagation();
            next();
          }}
          aria-label="下一张"
        >
          ›
        </button>
      )}
    </div>
  );
}
