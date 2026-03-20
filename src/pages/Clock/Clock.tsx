import { useState, useEffect } from "react";
import { ResizableCard } from "../../components/ResizableCard";
import { Button } from "../../components/buttons/Button";
import { theme } from "../../config/theme";

const STORAGE_KEY = "clock-start-time";
const METABOLIC_RATE_KEY = "clock-metabolic-rate";
const CONSUMED_CALORIES_KEY = "clock-consumed-calories";
const UNIT_KEY = "clock-unit";
const CALORIES_PER_LB_FAT = 3500;
const LBS_PER_KG = 2.20462;
const MS_PER_DAY = 86400000;

function loadStartTime(): number | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const ts = Number(stored);
    if (!isNaN(ts)) return ts;
  }
  return null;
}

function loadNumber(key: string): number {
  const stored = localStorage.getItem(key);
  if (stored) {
    const n = Number(stored);
    if (!isNaN(n)) return n;
  }
  return 0;
}

function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const centiseconds = Math.floor((ms % 1000) / 10);

  const pad = (n: number, len = 2) => String(n).padStart(len, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}.${pad(centiseconds)}`;
}

function toLocalDatetimeString(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function Clock() {
  const [startTime, setStartTime] = useState<number | null>(loadStartTime);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [elapsed, setElapsed] = useState("");
  const [inputValue, setInputValue] = useState(() => {
    const saved = loadStartTime();
    return saved !== null ? toLocalDatetimeString(saved) : "";
  });
  const [metabolicRate, setMetabolicRate] = useState(() => loadNumber(METABOLIC_RATE_KEY));
  const [consumedCalories, setConsumedCalories] = useState(() => loadNumber(CONSUMED_CALORIES_KEY));
  const [unit, setUnit] = useState<"lbs" | "kg">(() => (localStorage.getItem(UNIT_KEY) === "kg" ? "kg" : "lbs"));

  useEffect(() => {
    if (startTime === null) return;
    const update = () => {
      const ms = Date.now() - startTime;
      setElapsedMs(ms);
      setElapsed(formatElapsed(ms));
    };
    update();
    const id = setInterval(update, 10);
    return () => clearInterval(id);
  }, [startTime]);

  const handleSet = () => {
    const ts = new Date(inputValue).getTime();
    if (isNaN(ts)) return;
    localStorage.setItem(STORAGE_KEY, String(ts));
    setStartTime(ts);
  };

  const handleClear = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(METABOLIC_RATE_KEY);
    localStorage.removeItem(CONSUMED_CALORIES_KEY);
    setStartTime(null);
    setElapsedMs(0);
    setElapsed("");
    setInputValue("");
    setMetabolicRate(0);
    setConsumedCalories(0);
  };

  const handleMetabolicRateChange = (value: string) => {
    const n = value === "" ? 0 : Number(value);
    if (isNaN(n)) return;
    setMetabolicRate(n);
    localStorage.setItem(METABOLIC_RATE_KEY, String(n));
  };

  const handleConsumedCaloriesChange = (value: string) => {
    const n = value === "" ? 0 : Number(value);
    if (isNaN(n)) return;
    setConsumedCalories(n);
    localStorage.setItem(CONSUMED_CALORIES_KEY, String(n));
  };

  const caloriesBurned = metabolicRate * (elapsedMs / MS_PER_DAY);
  const netCalories = caloriesBurned - consumedCalories;
  const fatLostLbs = netCalories / CALORIES_PER_LB_FAT;
  const fatLostDisplay = unit === "kg" ? fatLostLbs / LBS_PER_KG : fatLostLbs;
  const fatVolumeCm3 = fatLostLbs * 468; // 1 lb fat ~ 468 cm³

  const getFatComparison = (cm3: number): string => {
    if (cm3 <= 0) return "";
  
    // Small
    if (cm3 < 5) return "a pea (~1 tsp)";
    if (cm3 < 10) return "a marble (~2 tsp)";
    if (cm3 < 20) return "a grape (~1 tbsp)";
    if (cm3 < 40) return "a large strawberry (~2–3 tbsp)";
    if (cm3 < 60) return "a shot glass (~2 oz)";
    if (cm3 < 80) return "a small egg";
    if (cm3 < 120) return "a golf ball";
    if (cm3 < 180) return "a chicken egg";
    if (cm3 < 250) return "a tennis ball";
    if (cm3 < 350) return "a baseball";
    if (cm3 < 500) return "an apple";
    if (cm3 < 700) return "a large orange";
    if (cm3 < 900) return "a grapefruit";
    if (cm3 < 1100) return "a 1-liter bottle";
    if (cm3 < 1300) return "a large water bottle (~1.25L)";
    if (cm3 < 1600) return "a cantaloupe (~1.5L)";
    if (cm3 < 1900) return "a large melon (~1.8L)";
    if (cm3 < 2200) return "a small watermelon (~2L)";
    if (cm3 < 2600) return "a 2.5-liter soda bottle";
    if (cm3 < 3000) return "a 3-liter soda bottle";
    if (cm3 < 3400) return "almost a gallon (~3.4L)";
    if (cm3 < 3800) return "a gallon of milk (~3.8L)";
    if (cm3 < 4200) return "a large milk jug (~4.2L)";
    if (cm3 < 4600) return "a small basketball (~4.5L)";
    if (cm3 < 5000) return "a basketball (~5L)";
    if (cm3 < 5600) return "a large basketball (~5.5L)";
    if (cm3 < 6200) return "a small watermelon (~6L)";
    if (cm3 < 7000) return "a large watermelon (~7L)";
    if (cm3 < 8000) return "two gallon jugs (~8L)";
    if (cm3 < 9000) return "a beach ball (~9L)";
    if (cm3 < 10000) return "a large beach ball (~10L)";
    if (cm3 < 11500) return "a small cooler (~11L)";
    if (cm3 < 13000) return "a medium cooler (~13L)";
    if (cm3 < 15000) return "a carry-on suitcase (~15L)";
    if (cm3 < 17000) return "a large backpack (~17L)";
    if (cm3 < 20000) return "a big storage bin (~20L)";
    if (cm3 < 24000) return "a large storage bin (~24L)";
    if (cm3 < 30000) return "a small bean bag chair (~30L)";
    if (cm3 < 40000) return "a medium bean bag chair (~40L)";
    if (cm3 < 50000) return "a large bean bag chair (~50L)";
    
    return "an extra-large bean bag chair (50L+)";
  };

  const inputStyle = { ...theme.input, width: 120 };
  const labelStyle = { fontSize: "0.875rem" };
  const statStyle = { fontSize: "1rem", fontFamily: "monospace" };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100%",
      }}
    >
      <ResizableCard
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
        }}
      >
        <h2 style={{ margin: 0 }}>Stopwatch</h2>
        {startTime !== null ? (
          <>
            <div
              style={{
                fontFamily: "monospace",
                fontSize: "3rem",
                fontWeight: 700,
                letterSpacing: 2,
              }}
            >
              {elapsed}
            </div>
            <div style={{ display: "flex", gap: 16, alignItems: "flex-end" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={labelStyle}>Metabolic rate (cal/day)</label>
                <input
                  type="number"
                  value={metabolicRate || ""}
                  onChange={(e) => handleMetabolicRateChange(e.target.value)}
                  placeholder="2000"
                  style={inputStyle}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={labelStyle}>Consumed (cal)</label>
                <input
                  type="number"
                  value={consumedCalories || ""}
                  onChange={(e) => handleConsumedCaloriesChange(e.target.value)}
                  placeholder="0"
                  style={inputStyle}
                />
              </div>
            </div>
            {metabolicRate > 0 && (
              <>
                <div style={{ display: "flex", gap: 24, textAlign: "center" }}>
                  <div>
                    <div style={labelStyle}>Burned</div>
                    <div style={statStyle}>{Math.round(caloriesBurned)} cal</div>
                  </div>
                  <div>
                    <div style={labelStyle}>Net</div>
                    <div style={statStyle}>{Math.round(netCalories)} cal</div>
                  </div>
                  <div>
                    <div style={labelStyle}>Fat lost</div>
                    <div style={{ ...statStyle, display: "flex", alignItems: "center", gap: 4 }}>
                      {fatLostDisplay.toFixed(2)}
                      <select
                        value={unit}
                        onChange={(e) => { setUnit(e.target.value as "lbs" | "kg"); localStorage.setItem(UNIT_KEY, e.target.value); }}
                        style={{
                          ...theme.input,
                          fontSize: "0.75rem",
                          padding: "2px 4px",
                          width: "auto",
                        }}
                      >
                        <option value="lbs">lbs</option>
                        <option value="kg">kg</option>
                      </select>
                    </div>
                  </div>
                </div>
                {fatVolumeCm3 > 0 && (() => {
                  const liters = fatVolumeCm3 / 1000;
                  const fullGlasses = Math.floor(liters);
                  const partialFill = liters - fullGlasses;
                  const glassHeight = 140;
                  const glassWidth = 64;

                  const BeerGlass = ({ fill }: { fill: number }) => {
                    const f = Math.min(fill, 1);
                    const glassTop = 4.2;
                    const glassBottom = 57.3;
                    const glassRange = glassBottom - glassTop;
                    const fillY = glassBottom - f * glassRange;
                    const foamHeight = f > 0.05 ? (f >= 1 ? 8 : 5) : 0;
                    const uid = `clip-${Math.random().toString(36).slice(2)}`;
                    return (
                      <svg width={glassWidth} height={glassHeight} viewBox="6 -2 56 62" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                          {/* Clip to inside of glass body */}
                          <clipPath id={uid}>
                            <path d="M14.4,0 H45.7 V57.269 H14.4 Z" />
                          </clipPath>
                        </defs>
                        {/* Foam (drawn first so beer covers the bottom edge) */}
                        {foamHeight > 0 && (
                          f >= 1 ? (
                            <ellipse cx="30" cy={fillY - 1} rx="17" ry={foamHeight}
                              fill="#f5e6c8" opacity="0.9" />
                          ) : (
                            <rect clipPath={`url(#${uid})`} x="14" y={fillY - foamHeight} width="32" height={foamHeight + 1}
                              fill="#f5e6c8" opacity="0.9" />
                          )
                        )}
                        {/* Beer fill */}
                        <rect clipPath={`url(#${uid})`} x="14" y={fillY} width="32" height={glassBottom - fillY}
                          fill="url(#beerGrad)" />
                        {/* Glass outline */}
                        <g transform="translate(12.775 3.578)">
                          <path d="M32.912,55.012v-9.8c3.925-.231,5.649-1.864,7.2-4.539,1.678-2.895,1.875-12.886,1.877-12.986V10.646a.975.975,0,0,0-1.008-.935H32.912V1.657H1.66V55.012H32.912m.541-42.75h5.7c.3,0,.545.332.545.738l0,14.136c0,.08-.108,9.079-1.015,11.367a5.341,5.341,0,0,1-5.231,3.608c-.3,0-.545-.332-.545-.738l0-28.372c0-.407.245-.738.545-.738m-.541,45H1.66A2.255,2.255,0,0,1-.6,55.012V1.657A2.255,2.255,0,0,1,1.66-.6H32.912a2.255,2.255,0,0,1,2.257,2.253v5.8h5.809a3.231,3.231,0,0,1,3.265,3.188V27.683q0,.02,0,.04c0,.026-.05,2.625-.319,5.607-.562,6.225-1.54,7.913-1.861,8.467-1.36,2.35-3.157,4.582-6.893,5.38v7.834a2.255,2.255,0,0,1-2.257,2.253Zm2.253-42.75,0,24.934a3.366,3.366,0,0,0,1.422-1.775c.072-.183.445-1.318.692-5.8.132-2.4.162-4.566.165-4.748l0-12.608Z"
                            fill="none" stroke={theme.colors.text} strokeWidth="1.5" />
                        </g>
                        {/* Handle detail lines */}
                        <g transform="translate(20.525 12.022)">
                          <path d="M25.839,93.161v24.558" fill="none" stroke={theme.colors.text} strokeLinecap="round" strokeWidth="1.8" transform="translate(-25.839 -93.161)"/>
                        </g>
                        <g transform="translate(20.525 42.195)">
                          <path d="M25.839,100.546V107" fill="none" stroke={theme.colors.text} strokeLinecap="round" strokeWidth="1.8" transform="translate(-25.839 -100.546)"/>
                        </g>
                        {/* Beer gradient definition */}
                        <defs>
                          <linearGradient id="beerGrad" x1="0" y1="1" x2="0" y2="0">
                            <stop offset="0%" stopColor="#c8820a" />
                            <stop offset="100%" stopColor="#f5b731" />
                          </linearGradient>
                        </defs>
                      </svg>
                    );
                  };

                  return (
                    <>
                      <div style={{ fontSize: "0.875rem", color: theme.colors.text, textAlign: "center" }}>
                        Your fat loss visualized in beer
                      </div>
                      <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 6, flexWrap: "wrap" }}>
                        {Array.from({ length: fullGlasses }, (_, i) => (
                          <BeerGlass key={`full-${i}`} fill={1} />
                        ))}
                        {partialFill > 0.01 && <BeerGlass fill={partialFill} />}
                      </div>
                      <div style={{ fontSize: "0.875rem", color: theme.colors.placeholder, textAlign: "center" }}>
                        {liters.toFixed(2)}L — about the size of {getFatComparison(fatVolumeCm3)}
                      </div>
                    </>
                  );
                })()}
              </>
            )}
            <Button onClick={handleClear} size="sm" variant="secondary">
              Clear
            </Button>
          </>
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 8,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: "0.875rem" }}>Start time</label>
              <input
                type="datetime-local"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                style={theme.input}
              />
            </div>
            <Button onClick={handleSet} size="md">
              Set
            </Button>
          </div>
        )}
      </ResizableCard>
    </div>
  );
}
