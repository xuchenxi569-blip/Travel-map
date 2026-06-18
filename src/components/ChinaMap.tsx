import { useEffect, useMemo, useState } from "react";
import { geoMercator, geoPath } from "d3-geo";
import type { Feature, FeatureCollection, Geometry } from "geojson";

const FIT = 1000; // 参考投影尺寸，最终 viewBox 由真实地理边界裁剪得到
const PAD = 16;

interface ProvinceProps {
  adcode: number;
  name: string;
  centroid?: [number, number];
  center?: [number, number];
}

type ProvinceFeature = Feature<Geometry, ProvinceProps>;

interface Props {
  selectedCode: string | null;
  onSelect: (code: string, name: string) => void;
  countByProvince: Record<string, number>;
}

export default function ChinaMap({ selectedCode, onSelect, countByProvince }: Props) {
  const [geo, setGeo] = useState<FeatureCollection<Geometry, ProvinceProps> | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}china.json`)
      .then((r) => r.json())
      .then((data: FeatureCollection<Geometry, ProvinceProps>) => setGeo(data))
      .catch((e) => console.error("地图数据加载失败", e));
  }, []);

  const { path, vb, named, decorative } = useMemo(() => {
    if (!geo)
      return { path: null, vb: null, named: [], decorative: [] as ProvinceFeature[] };
    const projection = geoMercator().fitSize([FIT, FIT], geo);
    const path = geoPath(projection);
    const named = geo.features.filter((f) => f.properties.name) as ProvinceFeature[];
    const decorative = geo.features.filter((f) => !f.properties.name) as ProvinceFeature[];
    // 用全部要素的真实边界裁剪出紧凑 viewBox，保证整张中国地图完整居中显示
    const [[x0, y0], [x1, y1]] = path.bounds(geo);
    const vb = {
      x: x0 - PAD,
      y: y0 - PAD,
      w: x1 - x0 + PAD * 2,
      h: y1 - y0 + PAD * 2,
    };
    return { path, vb, named, decorative };
  }, [geo]);

  const transform = useMemo(() => {
    if (!path || !vb || !selectedCode) return "translate(0,0) scale(1)";
    const feature = named.find((f) => String(f.properties.adcode) === selectedCode);
    if (!feature) return "translate(0,0) scale(1)";
    const [[x0, y0], [x1, y1]] = path.bounds(feature);
    const dx = x1 - x0;
    const dy = y1 - y0;
    const fcx = (x0 + x1) / 2;
    const fcy = (y0 + y1) / 2;
    const cx = vb.x + vb.w / 2;
    const cy = vb.y + vb.h / 2;
    const scale = Math.max(1, Math.min(6, 0.8 * Math.min(vb.w / dx, vb.h / dy)));
    const tx = cx - scale * fcx;
    const ty = cy - scale * fcy;
    return `translate(${tx},${ty}) scale(${scale})`;
  }, [path, vb, named, selectedCode]);

  if (!geo || !path || !vb) {
    return <div className="map-loading">地图加载中…</div>;
  }

  return (
    <svg
      className="china-map"
      viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="中国地图"
    >
      <defs>
        {/* 悬停光圈 */}
        <filter id="halo" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#ff8fa3" floodOpacity="0.9" />
          <feDropShadow dx="0" dy="0" stdDeviation="14" floodColor="#ffd6a5" floodOpacity="0.6" />
        </filter>
        <linearGradient id="visited" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ff9a8b" />
          <stop offset="55%" stopColor="#ff6a88" />
          <stop offset="100%" stopColor="#ff99ac" />
        </linearGradient>
        <linearGradient id="selected" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fbc2eb" />
          <stop offset="100%" stopColor="#ff7eb3" />
        </linearGradient>
      </defs>

      <g style={{ transition: "transform 0.6s cubic-bezier(0.22,1,0.36,1)" }} transform={transform}>
        {/* 南海诸岛等装饰要素 */}
        {decorative.map((f, i) => (
          <path
            key={`dec-${i}`}
            d={path(f) ?? undefined}
            className="province decorative"
            vectorEffect="non-scaling-stroke"
          />
        ))}

        {named.map((f) => {
          const code = String(f.properties.adcode);
          const count = countByProvince[code] ?? 0;
          const visited = count > 0;
          const isSelected = selectedCode === code;
          const isHovered = hovered === code;
          const cls = [
            "province",
            visited ? "visited" : "empty",
            isSelected ? "selected" : "",
            isHovered ? "hovered" : "",
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <path
              key={code}
              d={path(f) ?? undefined}
              className={cls}
              vectorEffect="non-scaling-stroke"
              filter={isHovered || isSelected ? "url(#halo)" : undefined}
              onMouseEnter={() => setHovered(code)}
              onMouseLeave={() => setHovered((h) => (h === code ? null : h))}
              onClick={() => onSelect(code, f.properties.name)}
            >
              <title>
                {f.properties.name}
                {visited ? `（${count} 张照片）` : ""}
              </title>
            </path>
          );
        })}

        {/* 已去过省份的照片数量角标 */}
        {named.map((f) => {
          const code = String(f.properties.adcode);
          const count = countByProvince[code] ?? 0;
          if (count === 0) return null;
          const pos = path.centroid(f);
          if (!pos || Number.isNaN(pos[0])) return null;
          return (
            <g
              key={`badge-${code}`}
              transform={`translate(${pos[0]},${pos[1]})`}
              className="badge"
              pointerEvents="none"
            >
              <circle r={11} className="badge-bg" vectorEffect="non-scaling-stroke" />
              <text className="badge-text" textAnchor="middle" dominantBaseline="central">
                {count}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}
