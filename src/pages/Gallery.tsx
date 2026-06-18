import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { usePhotos } from "../lib/PhotoContext";
import { PROVINCES } from "../data/provinces";

interface Draft {
  id: string;
  file: File;
  url: string;
  provinceCode: string;
  location: string;
  note: string;
}

export default function Gallery() {
  const { addPhoto, photos, removePhoto } = usePhotos();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [saving, setSaving] = useState(false);

  function addFiles(files: FileList | File[]) {
    const next: Draft[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      next.push({
        id: crypto.randomUUID(),
        file,
        url: URL.createObjectURL(file),
        provinceCode: "",
        location: "",
        note: "",
      });
    }
    setDrafts((prev) => [...prev, ...next]);
  }

  function updateDraft(id: string, patch: Partial<Draft>) {
    setDrafts((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  }

  function removeDraft(id: string) {
    setDrafts((prev) => {
      const target = prev.find((d) => d.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((d) => d.id !== id);
    });
  }

  const allTagged = drafts.length > 0 && drafts.every((d) => d.provinceCode);

  async function handleSave() {
    if (!allTagged || saving) return;
    setSaving(true);
    try {
      for (const d of drafts) {
        const province = PROVINCES.find((p) => p.code === d.provinceCode);
        if (!province) continue;
        await addPhoto({
          provinceCode: d.provinceCode,
          provinceName: province.name,
          blob: d.file,
          location: d.location.trim() || undefined,
          note: d.note.trim() || undefined,
        });
        URL.revokeObjectURL(d.url);
      }
      navigate("/");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="gallery">
      <header className="topbar">
        <Link to="/" className="btn-back">
          ‹ 返回地图
        </Link>
        <div className="brand">添加图片</div>
        <button
          className="btn-add"
          disabled={!allTagged || saving}
          onClick={handleSave}
        >
          {saving ? "保存中…" : `保存到地图${drafts.length ? `（${drafts.length}）` : ""}`}
        </button>
      </header>

      <main className="gallery-body">
        <div
          className={`dropzone ${dragOver ? "over" : ""}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            addFiles(e.dataTransfer.files);
          }}
        >
          <div className="dz-icon">＋</div>
          <p className="dz-title">点击或拖拽照片到这里</p>
          <p className="dz-sub">支持同时上传多张 · JPG / PNG / WEBP</p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => {
              if (e.target.files) addFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>

        {drafts.length > 0 && (
          <section className="draft-section">
            <h3>待保存（{drafts.length}）</h3>
            <div className="draft-grid">
              {drafts.map((d) => (
                <div className="draft-card" key={d.id}>
                  <div className="draft-thumb">
                    <img src={d.url} alt="预览" />
                    <button
                      className="draft-remove"
                      onClick={() => removeDraft(d.id)}
                      aria-label="移除"
                    >
                      ×
                    </button>
                  </div>
                  <div className="draft-fields">
                    <select
                      className={d.provinceCode ? "" : "needed"}
                      value={d.provinceCode}
                      onChange={(e) => updateDraft(d.id, { provinceCode: e.target.value })}
                    >
                      <option value="">选择省份 *</option>
                      {PROVINCES.map((p) => (
                        <option key={p.code} value={p.code}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="地点（如 西湖）"
                      value={d.location}
                      onChange={(e) => updateDraft(d.id, { location: e.target.value })}
                    />
                    <input
                      type="text"
                      placeholder="一句话备注"
                      value={d.note}
                      onChange={(e) => updateDraft(d.id, { note: e.target.value })}
                    />
                  </div>
                </div>
              ))}
            </div>
            {!allTagged && <p className="hint">请为每张照片选择对应省份后再保存。</p>}
          </section>
        )}

        {photos.length > 0 && (
          <section className="existing-section">
            <h3>已在地图上（{photos.length}）</h3>
            <div className="existing-grid">
              {photos.map((p) => (
                <div className="existing-card" key={p.id}>
                  <img src={p.url} alt={p.location ?? p.provinceName} loading="lazy" />
                  <div className="existing-meta">
                    <span className="tag">{p.provinceName}</span>
                    {p.location && <span className="existing-loc">{p.location}</span>}
                  </div>
                  <button
                    className="existing-del"
                    onClick={() => removePhoto(p.id)}
                    aria-label="删除"
                  >
                    删除
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
