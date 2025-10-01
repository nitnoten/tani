import React, { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, FeatureGroup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-draw";
import { motion } from "framer-motion";
import { Download, Upload, Trash2, Map as MapIcon, Layers, Search, Save, Leaf } from "lucide-react";
import * as turf from "@turf/turf";

// UI primitives (shadcn-style minimal clones to keep this single-file demo working)
const Button = ({ className = "", children, ...props }) => (
  <button
    className={`px-3 py-2 rounded-2xl shadow-sm border bg-white hover:bg-gray-50 active:translate-y-[1px] transition ${className}`}
    {...props}
  >
    {children}
  </button>
);
const Input = ({ className = "", ...props }) => (
  <input className={`px-3 py-2 rounded-xl border w-full focus:outline-none focus:ring ${className}`} {...props} />
);
const Select = ({ className = "", ...props }) => (
  <select className={`px-3 py-2 rounded-xl border w-full bg-white ${className}`} {...props} />
);
const Label = ({ children, className = "" }) => (
  <label className={`text-sm font-medium text-gray-700 ${className}`}>{children}</label>
);
const Card = ({ children, className = "" }) => (
  <div className={`rounded-2xl bg-white border shadow-sm ${className}`}>{children}</div>
);
const CardHeader = ({ children, className = "" }) => (
  <div className={`px-4 pt-4 ${className}`}>{children}</div>
);
const CardContent = ({ children, className = "" }) => (
  <div className={`px-4 pb-4 ${className}`}>{children}</div>
);

// Util: nice id
const makeId = () => Math.random().toString(36).slice(2, 9);

// Basemap options
const BASEMAPS = {
  OSM: {
    name: "OpenStreetMap",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "&copy; OpenStreetMap contributors",
  },
  ESRI_SAT: {
    name: "Esri Satellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{x}/{y}",
    attribution: "Tiles &copy; Esri",
  },
};

// Default crop options
const CROP_OPTIONS = [
  "Padi",
  "Jagung",
  "Kedelai",
  "Tebu",
  "Kopi",
  "Kelapa Sawit",
  "Sayuran Campuran",
  "Lainnya",
];

// Map Draw Control Wrapper
function DrawControl({ onCreated, onEdited, onDeleted, featureGroupRef, color }) {
  const map = useMap();
  const drawControlRef = useRef(null);

  useEffect(() => {
    if (!map || !featureGroupRef.current) return;

    // Remove old control if any
    if (drawControlRef.current) {
      map.removeControl(drawControlRef.current);
    }

    const options = {
      position: "topleft",
      draw: {
        polyline: false,
        circle: false,
        circlemarker: false,
        marker: {
          icon: new L.Icon.Default(),
        },
        rectangle: {
          shapeOptions: { color },
        },
        polygon: {
          allowIntersection: false,
          showArea: true,
          shapeOptions: { color },
        },
      },
      edit: {
        featureGroup: featureGroupRef.current,
        remove: true,
      },
    };
    const drawControl = new L.Control.Draw(options);
    drawControlRef.current = drawControl;
    map.addControl(drawControl);

    const created = (e) => onCreated?.(e);
    const edited = (e) => onEdited?.(e);
    const deleted = (e) => onDeleted?.(e);

    map.on(L.Draw.Event.CREATED, created);
    map.on(L.Draw.Event.EDITED, edited);
    map.on(L.Draw.Event.DELETED, deleted);

    return () => {
      map.off(L.Draw.Event.CREATED, created);
      map.off(L.Draw.Event.EDITED, edited);
      map.off(L.Draw.Event.DELETED, deleted);
      map.removeControl(drawControl);
    };
  }, [map, featureGroupRef, color, onCreated, onEdited, onDeleted]);

  return null;
}

// Main App
export default function AgriTagger() {
  const featureGroupRef = useRef(null);
  const [features, setFeatures] = useState([]); // {id, geojson, properties}
  const [selectedId, setSelectedId] = useState(null);
  const [basemap, setBasemap] = useState("OSM");
  const [drawColor, setDrawColor] = useState("#10b981"); // emerald
  const [search, setSearch] = useState("");
  const [filterCrop, setFilterCrop] = useState("Semua");

  // load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("agritagger:features");
    if (saved) {
      try {
        const arr = JSON.parse(saved);
        setFeatures(arr);
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("agritagger:features", JSON.stringify(features));
  }, [features]);

  // Area calculation helper
  const computeAreaHa = (feature) => {
    try {
      if (!feature) return 0;
      if (feature.geometry.type === "Polygon" || feature.geometry.type === "MultiPolygon") {
        return turf.area(feature) / 10000.0; // m^2 to ha
      }
      return 0;
    } catch (e) {
      return 0;
    }
  };

  // Add layer helper
  const addLayerFromEvent = (layer, type) => {
    const id = makeId();
    layer.agriId = id;

    // Apply style
    if (layer.setStyle) layer.setStyle({ color: drawColor });

    if (featureGroupRef.current) {
      featureGroupRef.current.addLayer(layer);
    }

    const gj = layer.toGeoJSON();
    const props = {
      name: `${type === "marker" ? "Titik" : "Lahan"} ${features.length + 1}`,
      crop: "Padi",
      season: "Musim Tanam 1",
      color: drawColor,
      notes: "",
      createdAt: new Date().toISOString(),
    };

    const feature = { id, geojson: gj, properties: props };
    setFeatures((prev) => [...prev, feature]);
    setSelectedId(id);
  };

  const handleCreated = (e) => {
    const { layerType, layer } = e;
    addLayerFromEvent(layer, layerType);
  };

  const handleEdited = (e) => {
    const layers = e.layers;
    const updated = [];
    layers.eachLayer((layer) => {
      const id = layer.agriId;
      const gj = layer.toGeoJSON();
      updated.push({ id, gj });
    });

    setFeatures((prev) =>
      prev.map((f) => {
        const up = updated.find((u) => u.id === f.id);
        if (up) return { ...f, geojson: up.gj };
        return f;
      })
    );
  };

  const handleDeleted = (e) => {
    const ids = [];
    e.layers.eachLayer((layer) => ids.push(layer.agriId));
    setFeatures((prev) => prev.filter((f) => !ids.includes(f.id)));
    if (ids.includes(selectedId)) setSelectedId(null);
  };

  // Sync styles on color change for selected feature
  useEffect(() => {
    if (!featureGroupRef.current) return;
    featureGroupRef.current.eachLayer((layer) => {
      if (layer.agriId) {
        const f = features.find((x) => x.id === layer.agriId);
        if (f?.properties?.color && layer.setStyle) {
          layer.setStyle({ color: f.properties.color });
        }
      }
    });
  }, [features]);

  // When features in state load/restore, ensure map has layers for edit control
  useEffect(() => {
    if (!featureGroupRef.current) return;

    // Clear all and re-add from state for consistency
    const fg = featureGroupRef.current;
    fg.clearLayers();

    features.forEach((f) => {
      const layer = L.geoJSON(f.geojson, {
        style: { color: f.properties?.color || drawColor },
        pointToLayer: (feature, latlng) => L.marker(latlng),
      });

      layer.eachLayer((lyr) => {
        lyr.agriId = f.id;
        fg.addLayer(lyr);
      });
    });
  }, []); // only on first mount to avoid flicker; edits handled by draw events

  const selected = useMemo(() => features.find((f) => f.id === selectedId) || null, [features, selectedId]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return features.filter((f) => {
      const okCrop = filterCrop === "Semua" || f.properties.crop === filterCrop;
      const okSearch = !term ||
        f.properties.name.toLowerCase().includes(term) ||
        (f.properties.notes || "").toLowerCase().includes(term);
      return okCrop && okSearch;
    });
  }, [features, search, filterCrop]);

  const updateSelected = (patch) => {
    if (!selected) return;
    setFeatures((arr) => arr.map((f) => (f.id === selected.id ? { ...f, properties: { ...f.properties, ...patch } } : f)));
  };

  const exportGeoJSON = () => {
    const fc = {
      type: "FeatureCollection",
      features: features.map((f) => ({ ...f.geojson, properties: f.properties })),
    };
    const blob = new Blob([JSON.stringify(fc, null, 2)], { type: "application/geo+json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `agritagger_${new Date().toISOString().substring(0, 10)}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importGeoJSON = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (data.type !== "FeatureCollection" || !Array.isArray(data.features)) throw new Error("Bukan FeatureCollection");

        const newItems = [];
        const fg = featureGroupRef.current;
        data.features.forEach((feat) => {
          const id = makeId();
          const properties = feat.properties || {};
          const color = properties.color || drawColor;
          const geo = { type: "Feature", geometry: feat.geometry, properties };

          // create Leaflet layers and add
          const layer = L.geoJSON(geo, {
            style: { color },
            pointToLayer: (feature, latlng) => L.marker(latlng),
          });
          layer.eachLayer((lyr) => {
            lyr.agriId = id;
            if (lyr.setStyle) lyr.setStyle({ color });
            fg.addLayer(lyr);
          });

          newItems.push({ id, geojson: geo, properties: { name: properties.name || `Lahan ${features.length + newItems.length + 1}`, crop: properties.crop || "Padi", season: properties.season || "Musim Tanam 1", notes: properties.notes || "", color } });
        });

        setFeatures((prev) => [...prev, ...newItems]);
        if (newItems[0]) setSelectedId(newItems[0].id);
      } catch (e) {
        alert("Gagal mengimpor GeoJSON: " + e.message);
      }
    };
    reader.readAsText(file);
  };

  const zoomToFeature = (id) => {
    const map = featureGroupRef.current?._map;
    if (!map) return;
    let bounds = null;
    featureGroupRef.current.eachLayer((layer) => {
      if (layer.agriId === id) {
        if (layer.getBounds) bounds = layer.getBounds();
        else if (layer.getLatLng) {
          const ll = layer.getLatLng();
          bounds = L.latLngBounds([ll, ll]);
        }
      }
    });
    if (bounds) map.fitBounds(bounds.pad(0.4));
  };

  const deleteFeature = (id) => {
    // remove from map
    const toRemove = [];
    featureGroupRef.current.eachLayer((layer) => {
      if (layer.agriId === id) toRemove.push(layer);
    });
    toRemove.forEach((l) => featureGroupRef.current.removeLayer(l));

    // remove from state
    setFeatures((prev) => prev.filter((f) => f.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  return (
    <div className="w-full h-screen grid grid-cols-1 lg:grid-cols-[380px_1fr] bg-gray-50 text-gray-900">
      {/* Sidebar */}
      <aside className="h-full overflow-y-auto border-r bg-white">
        <Card className="border-0 rounded-none">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Leaf className="w-6 h-6 text-emerald-600" />
              <h1 className="text-xl font-semibold">AgriTagger</h1>
            </div>
            <p className="text-sm text-gray-500 mt-1">Website untuk tagging & manajemen lahan pertanian.</p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="relative w-full">
                <Search className="w-4 h-4 absolute left-2 top-2.5 text-gray-400" />
                <Input placeholder="Cari nama/notes…" className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-3">
              <div>
                <Label>Filter komoditas</Label>
                <Select value={filterCrop} onChange={(e) => setFilterCrop(e.target.value)}>
                  <option>Semua</option>
                  {CROP_OPTIONS.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Warna gambar</Label>
                <Input type="color" value={drawColor} onChange={(e) => setDrawColor(e.target.value)} />
              </div>
            </div>

            <div className="flex gap-2 mt-3">
              <Button onClick={exportGeoJSON} title="Export GeoJSON">
                <div className="flex items-center gap-2"><Download className="w-4 h-4" /> Export</div>
              </Button>
              <label>
                <input type="file" accept=".json,.geojson,application/geo+json" className="hidden" onChange={(e) => e.target.files?.[0] && importGeoJSON(e.target.files[0])} />
                <Button className="cursor-pointer"><div className="flex items-center gap-2"><Upload className="w-4 h-4" /> Import</div></Button>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* List */}
        <div className="p-3">
          <div className="text-xs text-gray-500 mb-2">{filtered.length} fitur</div>
          <div className="flex flex-col gap-2">
            {filtered.map((f) => {
              const ha = computeAreaHa(f.geojson);
              const isSel = f.id === selectedId;
              return (
                <motion.div key={f.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                  <div className={`rounded-2xl border p-3 bg-white shadow-sm ${isSel ? "ring-2 ring-emerald-500" : ""}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ background: f.properties.color }} />
                          <button className="font-medium truncate hover:underline" onClick={() => { setSelectedId(f.id); zoomToFeature(f.id); }}>{f.properties.name}</button>
                        </div>
                        <div className="text-xs text-gray-500 mt-1 truncate">{f.properties.crop} • {ha ? `${ha.toFixed(2)} ha` : "—"}</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button className="text-xs" onClick={() => { setSelectedId(f.id); zoomToFeature(f.id); }} title="Zoom ke fitur"><MapIcon className="w-4 h-4" /></Button>
                        <Button className="text-xs" onClick={() => deleteFeature(f.id)} title="Hapus"><Trash2 className="w-4 h-4 text-red-600" /></Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
            {filtered.length === 0 && (
              <div className="text-sm text-gray-500 p-3">Belum ada fitur. Gunakan alat gambar di peta untuk menambahkan lahan (polygon/rectangle) atau titik.</div>
            )}
          </div>
        </div>

        {/* Editor */}
        {selected && (
          <div className="p-3 pt-0">
            <Card>
              <CardHeader>
                <div className="font-semibold">Detail Lahan</div>
                <div className="text-xs text-gray-500">ID: {selected.id}</div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label>Nama</Label>
                  <Input value={selected.properties.name} onChange={(e) => updateSelected({ name: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Komoditas</Label>
                    <Select value={selected.properties.crop} onChange={(e) => updateSelected({ crop: e.target.value })}>
                      {CROP_OPTIONS.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label>Musim</Label>
                    <Select value={selected.properties.season} onChange={(e) => updateSelected({ season: e.target.value })}>
                      {[
                        "Musim Tanam 1",
                        "Musim Tanam 2",
                        "Musim Tanam 3",
                        "Musim Kering",
                        "Musim Hujan",
                      ].map((m) => (
                        <option key={m}>{m}</option>
                      ))}
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Warna garis</Label>
                  <Input type="color" value={selected.properties.color} onChange={(e) => updateSelected({ color: e.target.value })} />
                </div>
                <div>
                  <Label>Catatan</Label>
                  <textarea className="w-full border rounded-xl p-2" rows={3} value={selected.properties.notes} onChange={(e) => updateSelected({ notes: e.target.value })} />
                </div>
                <div className="text-sm text-gray-600">Perkiraan luas: <span className="font-medium">{computeAreaHa(selected.geojson).toFixed(2)} ha</span></div>
                <div className="flex gap-2">
                  <Button onClick={() => zoomToFeature(selected.id)}><MapIcon className="w-4 h-4 mr-1" /> Zoom</Button>
                  <Button onClick={() => deleteFeature(selected.id)} className="text-red-600"><Trash2 className="w-4 h-4 mr-1" /> Hapus</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </aside>

      {/* Map */}
      <div className="relative h-full">
        <div className="absolute z-[500] left-3 top-3 flex gap-2">
          <Button onClick={() => setBasemap(basemap === "OSM" ? "ESRI_SAT" : "OSM")} title="Ganti basemap">
            <div className="flex items-center gap-2"><Layers className="w-4 h-4" /> {BASEMAPS[basemap].name}</div>
          </Button>
        </div>
        <MapContainer center={[-2.5, 117]} zoom={5} className="h-full w-full" style={{ zIndex: 0 }}>
          <TileLayer url={BASEMAPS[basemap].url} attribution={BASEMAPS[basemap].attribution} />

          <FeatureGroup ref={featureGroupRef} />

          <DrawControl
            featureGroupRef={featureGroupRef}
            color={drawColor}
            onCreated={handleCreated}
            onEdited={handleEdited}
            onDeleted={handleDeleted}
          />
        </MapContainer>
      </div>
    </div>
  );
}
