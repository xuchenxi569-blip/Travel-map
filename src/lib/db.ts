import { openDB, type DBSchema, type IDBPDatabase } from "idb";

export interface PhotoRecord {
  id: string;
  provinceCode: string; // adcode as string, e.g. "330000"
  provinceName: string; // e.g. "浙江省"
  blob: Blob; // original image data
  location?: string; // free text, e.g. "西湖"
  note?: string;
  createdAt: number;
}

interface GalleryDB extends DBSchema {
  photos: {
    key: string;
    value: PhotoRecord;
    indexes: { "by-province": string; "by-created": number };
  };
}

let dbPromise: Promise<IDBPDatabase<GalleryDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<GalleryDB>("map-gallery", 1, {
      upgrade(db) {
        const store = db.createObjectStore("photos", { keyPath: "id" });
        store.createIndex("by-province", "provinceCode");
        store.createIndex("by-created", "createdAt");
      },
    });
  }
  return dbPromise;
}

export async function addPhoto(
  record: Omit<PhotoRecord, "id" | "createdAt">
): Promise<PhotoRecord> {
  const db = await getDB();
  const full: PhotoRecord = {
    ...record,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };
  await db.put("photos", full);
  return full;
}

export async function getAllPhotos(): Promise<PhotoRecord[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex("photos", "by-created");
  return all.reverse(); // newest first
}

export async function getPhotosByProvince(
  provinceCode: string
): Promise<PhotoRecord[]> {
  const db = await getDB();
  const list = await db.getAllFromIndex("photos", "by-province", provinceCode);
  return list.sort((a, b) => b.createdAt - a.createdAt);
}

export async function deletePhoto(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("photos", id);
}
