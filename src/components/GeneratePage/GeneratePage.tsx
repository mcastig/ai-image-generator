"use client";

import { useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useStore } from "@/store/useStore";
import { RESOLUTIONS, COLOR_OPTIONS } from "@/types";
import type { Image as ImageType } from "@/types";
import "./GeneratePage.css";

interface GeneratePageProps {
  prefillSettings?: Partial<ImageType> | null;
  onClearPrefill?: () => void;
}

export default function GeneratePage({ prefillSettings, onClearPrefill }: GeneratePageProps) {
  const { data: session } = useSession();
  const { setShowSignInModal } = useStore();

  const [prompt, setPrompt] = useState(prefillSettings?.prompt ?? "");
  const [negativePrompt, setNegativePrompt] = useState(prefillSettings?.negativePrompt ?? "");
  const [color, setColor] = useState(prefillSettings?.color ?? "");
  const [resolution, setResolution] = useState(prefillSettings?.resolution ?? "1024x1024");
  const [guidance, setGuidance] = useState(prefillSettings?.guidance ?? 5);
  const [generatedImage, setGeneratedImage] = useState<ImageType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGenerate() {
    if (!session) {
      setShowSignInModal(true);
      return;
    }
    if (!prompt.trim()) {
      setError("Please enter a prompt.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, negativePrompt, color, resolution, guidance }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      setGeneratedImage(data.image);
      if (onClearPrefill) onClearPrefill();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="generate-page">
      <div className="generate-page__form">
        <div className="generate-page__field">
          <label className="generate-page__label">Prompt</label>
          <textarea
            className="generate-page__textarea"
            placeholder="Enter the prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
          />
        </div>

        <div className="generate-page__field">
          <label className="generate-page__label">Negative Prompt (Optional)</label>
          <textarea
            className="generate-page__textarea"
            placeholder="Enter the prompt"
            value={negativePrompt}
            onChange={(e) => setNegativePrompt(e.target.value)}
            rows={2}
          />
        </div>

        <div className="generate-page__field">
          <label className="generate-page__label">Colors</label>
          <div className="generate-page__colors">
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c.value}
                className={`generate-page__color-swatch ${color === c.value ? "generate-page__color-swatch--active" : ""}`}
                style={{ backgroundColor: c.value }}
                onClick={() => setColor(color === c.value ? "" : c.value)}
                title={c.label}
              />
            ))}
            <button
              className="generate-page__color-clear"
              onClick={() => setColor("")}
              title="No color"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="generate-page__field">
          <label className="generate-page__label">Resolution</label>
          <div className="generate-page__resolutions">
            {RESOLUTIONS.map((r) => (
              <button
                key={r.value}
                className={`generate-page__resolution-pill ${resolution === r.value ? "generate-page__resolution-pill--active" : ""}`}
                onClick={() => setResolution(r.value)}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div className="generate-page__field">
          <label className="generate-page__label">Guidance ({guidance.toFixed(1)})</label>
          <input
            type="range"
            className="generate-page__slider"
            min={1}
            max={10}
            step={0.1}
            value={guidance}
            onChange={(e) => setGuidance(Number(e.target.value))}
          />
        </div>

        {error && <p className="generate-page__error">{error}</p>}

        <button
          className="generate-page__btn"
          onClick={handleGenerate}
          disabled={loading}
        >
          <Image src="/resources/Magic.svg" alt="" width={18} height={18} />
          {loading ? "Generating..." : "Generate Image"}
        </button>
      </div>

      <div className="generate-page__preview">
        {loading ? (
          <div className="generate-page__preview-loading">
            <div className="generate-page__spinner" />
            <p>Generating your image…</p>
          </div>
        ) : generatedImage ? (
          <img
            src={generatedImage.image_url ?? generatedImage.imageUrl ?? ""}
            alt={prompt}
            className="generate-page__preview-img"
          />
        ) : (
          <div className="generate-page__preview-placeholder">
            <Image
              src="/resources/Box-shape.png"
              alt="Placeholder"
              width={220}
              height={220}
              style={{ opacity: 0.5 }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
