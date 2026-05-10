"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/store/useStore";
import type { Image as ImageType } from "@/types";
import "./GenerationHistoryPage.css";

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

            return (
              <div
                key={image.id}
                className="history-page__item"
                onClick={() => handleClick(image)}
              >
                <img src={imageUrl} alt={image.prompt} className="history-page__item-img" />
                <div className="history-page__item-info">
                  <p className="history-page__item-prompt">{image.prompt}</p>
                  <div className="history-page__item-meta">
                    <span className="history-page__item-date">{formatDate(createdAt)}</span>
                    <span className="history-page__item-resolution">{image.resolution}</span>
                    {image.seed && (
                      <span className="history-page__item-seed">Seed: {image.seed}</span>
                    )}
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
