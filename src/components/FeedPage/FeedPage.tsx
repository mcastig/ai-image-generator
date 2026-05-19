"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import ImageCard from "@/components/ImageCard/ImageCard";
import type { Image as ImageType } from "@/types";
import "./FeedPage.css";

export default function FeedPage() {
  const [images, setImages] = useState<ImageType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const fetchImages = useCallback(async (q?: string) => {
    setLoading(true);
    try {
      const url = q ? `/api/feed?q=${encodeURIComponent(q)}` : "/api/feed";
      const res = await fetch(url);
      const data = await res.json();
      setImages(data.images ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
    fetchImages(searchInput);
  }

  function handleSaveToggle(imageId: string, saved: boolean) {
    setImages((prev) =>
      prev.map((img) =>
        img.id === imageId ? { ...img, is_saved: saved, isSaved: saved } : img
      )
    );
  }

  return (
    <div className="feed-page">
      <div className="feed-page__search-bar">
        <form onSubmit={handleSearch} className="feed-page__search-form">
          <input
            className="feed-page__search-input"
            placeholder="Search images by keywords"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button type="submit" className="feed-page__search-btn">
            <Image src="/resources/Search.svg" alt="Search" width={18} height={18} className="feed-page__search-icon" />
          </button>
        </form>
      </div>

      {loading ? (
        <div className="feed-page__loading">
          <div className="feed-page__spinner" />
        </div>
      ) : images.length === 0 ? (
        <div className="feed-page__empty">
          {search ? `No results for "${search}"` : "No images yet. Be the first to generate one!"}
        </div>
      ) : (
        <div className="feed-page__grid">
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
