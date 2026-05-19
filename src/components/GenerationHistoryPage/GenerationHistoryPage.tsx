"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/store/useStore";
import type { Image as ImageType } from "@/types";
import { RESOLUTIONS } from "@/types";
import "./GenerationHistoryPage.css";

function formatResolution(value: string) {
  return RESOLUTIONS.find((r) => r.value === value)?.label ?? value;
}

export default function GenerationHistoryPage() {
  const [images, setImages] = useState<ImageType[]>([]);
  const [loading, setLoading] = useState(true);
  const { setSelectedImage, setShowImageDetail } = useStore();

  useEffect(() => {
    fetch("/api/history")
      .then((r) => r.json())
      .then((d) => setImages(d.images ?? []))
      .finally(() => setLoading(false));
  }, []);

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function handleClick(image: ImageType) {
    setSelectedImage(image);
    setShowImageDetail(true);
  }

  if (loading) {
    return (
      <div className="history-page__loading">
        <div className="history-page__spinner" />
      </div>
    );
  }

  return (
    <div className="history-page">
      <h1 className="history-page__title">Generation History</h1>

      {images.length === 0 ? (
        <div className="history-page__empty">You haven&apos;t generated any images yet.</div>
      ) : (
        <div className="history-page__list">
          {images.map((image) => {
            const imageUrl = image.image_url ?? image.imageUrl ?? "";
            const createdAt = image.created_at ?? image.createdAt ?? "";
            const negativePrompt = image.negative_prompt ?? image.negativePrompt;

            return (
              <div
                key={image.id}
                className="history-page__item"
                onClick={() => handleClick(image)}
              >
                <img src={imageUrl || undefined} alt={image.prompt} className="history-page__item-img" />

                <div className="history-page__item-details">
                  <div className="history-page__item-col">
                    <div className="history-page__field">
                      <span className="history-page__field-label">Prompt details</span>
                      <span className="history-page__field-value">{image.prompt}</span>
                    </div>
                    <div className="history-page__field">
                      <span className="history-page__field-label">Created on</span>
                      <span className="history-page__field-value">{formatDate(createdAt)}</span>
                    </div>
                    {!!image.seed && (
                      <div className="history-page__field">
                        <span className="history-page__field-label">Seed</span>
                        <span className="history-page__field-value">{image.seed}</span>
                      </div>
                    )}
                  </div>

                  <div className="history-page__item-col">
                    <div className="history-page__field">
                      <span className="history-page__field-label">Negative prompt</span>
                      <span className="history-page__field-value">{negativePrompt || "Null"}</span>
                    </div>
                    <div className="history-page__field">
                      <span className="history-page__field-label">Input Resolution</span>
                      <span className="history-page__field-value">{formatResolution(image.resolution)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
