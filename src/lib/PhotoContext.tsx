import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  addPhoto as dbAddPhoto,
  deletePhoto as dbDeletePhoto,
  getAllPhotos,
  type PhotoRecord,
} from "./db";

export interface PhotoItem extends PhotoRecord {
  url: string; // object URL for display
}

interface PhotoContextValue {
  photos: PhotoItem[];
  loading: boolean;
  /** Map of provinceCode -> photo count, for provinces that have photos. */
  countByProvince: Record<string, number>;
  addPhoto: (input: {
    provinceCode: string;
    provinceName: string;
    blob: Blob;
    location?: string;
    note?: string;
  }) => Promise<void>;
  removePhoto: (id: string) => Promise<void>;
  photosOf: (provinceCode: string) => PhotoItem[];
}

const PhotoContext = createContext<PhotoContextValue | null>(null);

export function PhotoProvider({ children }: { children: ReactNode }) {
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const urlsRef = useRef<Set<string>>(new Set());

  const toItem = useCallback((record: PhotoRecord): PhotoItem => {
    const url = URL.createObjectURL(record.blob);
    urlsRef.current.add(url);
    return { ...record, url };
  }, []);

  useEffect(() => {
    let cancelled = false;
    getAllPhotos()
      .then((records) => {
        if (cancelled) return;
        setPhotos(records.map(toItem));
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [toItem]);

  // Revoke all object URLs on unmount.
  useEffect(() => {
    const urls = urlsRef.current;
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);

  const addPhoto = useCallback<PhotoContextValue["addPhoto"]>(
    async (input) => {
      const record = await dbAddPhoto(input);
      setPhotos((prev) => [toItem(record), ...prev]);
    },
    [toItem]
  );

  const removePhoto = useCallback<PhotoContextValue["removePhoto"]>(async (id) => {
    await dbDeletePhoto(id);
    setPhotos((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) {
        URL.revokeObjectURL(target.url);
        urlsRef.current.delete(target.url);
      }
      return prev.filter((p) => p.id !== id);
    });
  }, []);

  const countByProvince = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of photos) {
      map[p.provinceCode] = (map[p.provinceCode] ?? 0) + 1;
    }
    return map;
  }, [photos]);

  const photosOf = useCallback(
    (provinceCode: string) => photos.filter((p) => p.provinceCode === provinceCode),
    [photos]
  );

  const value = useMemo<PhotoContextValue>(
    () => ({ photos, loading, countByProvince, addPhoto, removePhoto, photosOf }),
    [photos, loading, countByProvince, addPhoto, removePhoto, photosOf]
  );

  return <PhotoContext.Provider value={value}>{children}</PhotoContext.Provider>;
}

export function usePhotos() {
  const ctx = useContext(PhotoContext);
  if (!ctx) throw new Error("usePhotos must be used within PhotoProvider");
  return ctx;
}
