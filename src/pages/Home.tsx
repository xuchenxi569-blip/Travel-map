import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ChinaMap from "../components/ChinaMap";
import Lightbox from "../components/Lightbox";
import { usePhotos } from "../lib/PhotoContext";

export default function Home() {
  const { countByProvince, photosOf, photos } = usePhotos();
  const [selected, setSelected] = useState<{ code: string; name: string } | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const panelPhotos = useMemo(
    () => (selected ? photosOf(selected.code) : []),
    [selected, photosOf]
  );

  const visitedCount = Object.keys(countByProvince).length;

  return (
    <div className="home">
      <header className="topbar">
        <div className="brand">
          <span className="brand-dot" />
          足迹 · 地图相册
        </div>
        <Link to="/gallery" className="btn-add">
          ＋ 添加图片
        </Link>
      </header>

      <div className="stats">
        已点亮 <strong>{visitedCount}</strong> 个省份 · 共 <strong>{photos.length}</strong> 张照片
      </div>

      <main className="map-stage">
        <div className={`map-wrap ${selected ? "with-panel" : ""}`}>
          <ChinaMap
            selectedCode={selected?.code ?? null}
            onSelect={(code, name) => setSelected({ code, name })}
            countByProvince={countByProvince}
          />
        </div>

        <aside className={`side-panel ${selected ? "open" : ""}`}>
          {selected && (
            <>
              <div className="panel-head">
                <div>
                  <h2>{selected.name}</h2>
                  <p>{panelPhotos.length} 张照片</p>
                </div>
                <button className="panel-close" onClick={() => setSelected(null)} aria-label="返回">
                  ×
                </button>
              </div>

              {panelPhotos.length > 0 ? (
                <div className="photo-grid">
                  {panelPhotos.map((p, i) => (
                    <button
                      key={p.id}
                      className="photo-cell"
                      onClick={() => setLightboxIndex(i)}
                      style={{ animationDelay: `${i * 40}ms` }}
                    >
                      <img src={p.url} alt={p.location ?? selected.name} loading="lazy" />
                      {p.location && <span className="photo-loc">{p.location}</span>}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="panel-empty">
                  <p>这里还没有照片～</p>
                  <Link to="/gallery" className="btn-add small">
                    去上传第一张
                  </Link>
                </div>
              )}
            </>
          )}
        </aside>
      </main>

      {selected && lightboxIndex !== null && (
        <Lightbox
          photos={panelPhotos}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </div>
  );
}
