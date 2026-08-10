import { Bike, Car, Footprints } from "lucide-react";
import { useState } from "react";

import { Button } from "../common/Button";
import type { TravelMode } from "../../types/route";

const MODES: { value: TravelMode; label: string; icon: typeof Car }[] = [
  { value: "driving", label: "Driving", icon: Car },
  { value: "walking", label: "Walking", icon: Footprints },
  { value: "bicycling", label: "Cycling", icon: Bike },
];

interface RouteFormProps {
  onSubmit: (mood: string, origin: string, destination: string, mode: TravelMode) => void;
  disabled?: boolean;
}

const inputStyle: React.CSSProperties = {
  padding: "var(--space-3)",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--border)",
  background: "var(--surface)",
  color: "var(--text-h)",
  font: "inherit",
};

export function RouteForm({ onSubmit, disabled }: RouteFormProps) {
  const [mood, setMood] = useState("");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [mode, setMode] = useState<TravelMode>("driving");

  const canSubmit = mood.trim().length >= 3 && origin.trim().length >= 2 && destination.trim().length >= 2;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit) onSubmit(mood, origin, destination, mode);
      }}
      style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", maxWidth: 480 }}
    >
      <label style={{ fontSize: 14, color: "var(--text-h)", fontWeight: 600 }}>From</label>
      <input
        value={origin}
        onChange={(e) => setOrigin(e.target.value)}
        placeholder="e.g. Churchgate, Mumbai, India"
        style={inputStyle}
      />

      <label style={{ fontSize: 14, color: "var(--text-h)", fontWeight: 600 }}>To</label>
      <input
        value={destination}
        onChange={(e) => setDestination(e.target.value)}
        placeholder="e.g. Dindoshi, Mumbai, India"
        style={inputStyle}
      />
      <p style={{ fontSize: 12, marginTop: -4 }}>
        Include city and country for best results — short place names can match a same-named spot elsewhere in
        the world.
      </p>

      <label style={{ fontSize: 14, color: "var(--text-h)", fontWeight: 600 }}>Travel mode</label>
      <div style={{ display: "flex", gap: "var(--space-2)" }}>
        {MODES.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => setMode(value)}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              padding: "var(--space-3)",
              borderRadius: "var(--radius-md)",
              border: `1px solid ${mode === value ? "var(--accent)" : "var(--border)"}`,
              background: mode === value ? "var(--accent-bg)" : "var(--surface)",
              color: mode === value ? "var(--accent)" : "var(--text)",
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      <label style={{ fontSize: 14, color: "var(--text-h)", fontWeight: 600 }}>Mood for the trip</label>
      <textarea
        value={mood}
        onChange={(e) => setMood(e.target.value)}
        placeholder="e.g. upbeat energy to start the day"
        rows={2}
        style={{ ...inputStyle, resize: "vertical" }}
      />

      <Button type="submit" disabled={!canSubmit || disabled}>
        {disabled ? "Building..." : "Build route playlist"}
      </Button>
    </form>
  );
}
