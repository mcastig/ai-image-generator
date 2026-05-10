"use client";

import { useState, useEffect } from "react";
import ImageCard from "@/components/ImageCard/ImageCard";
import type { Image as ImageType } from "@/types";
import "./MyCollectionPage.css";

export default function MyCollectionPage() {
  const [images, setImages] = useState<ImageType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/collection")
      .then((r) => r.json())
      .then((d) => setImages(d.images ?? []))
      .finally(() => setLoading(false));
  }, []);

  function handleSaveToggle(imageId: string, saved: boolean) {
    if (!saved) {
      setImages((prev) => prev.filter((img) => img.id !== imageId));
    }
  }

  if (loading) {
    return (
      <div className="collection-page__loading">
        <div className="collection-page__spinner" />
      </div>
    );
  }

  return (
    <div className="collection-page">
      <h1 className="collection-page__title">My Collection</h1>

      {images.length === 0 ? (
        <div className="collection-page__empty">
          No saved images yet. Browse the feed and bookmark images you like!
        </div>
      ) : (
        <div className="collection-page__grid">
          {images.map((image) => (
            <ImageCard
              key={image.id}
              image={image}
              onSaveToggle={handleSaveToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}
