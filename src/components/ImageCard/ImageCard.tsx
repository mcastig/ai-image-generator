"use client";

import Image from "next/image";
import { useSession } from "next-auth/react";
import { useStore } from "@/store/useStore";
import type { Image as ImageType } from "@/types";
import "./ImageCard.css";

interface ImageCardProps {
  image: ImageType;
  onSaveToggle?: (imageId: string, saved: boolean) => void;
}

export default function ImageCard({ image, onSaveToggle }: ImageCardProps) {
  const { setSelectedImage, setShowImageDetail, setShowSignInModal } = useStore();
  const { data: session } = useSession();

  const imageUrl = image.image_url ?? image.imageUrl ?? "";
  const authorName = image.author_name ?? image.authorName;
  const authorAvatar = image.author_avatar ?? image.authorAvatar;
  const isSaved = image.is_saved ?? image.isSaved;

  function handleCardClick() {
    setSelectedImage(image);
    setShowImageDetail(true);
  }

  async function handleBookmark(e: React.MouseEvent) {
    e.stopPropagation();
    if (!session) {
      setShowSignInModal(true);
      return;
    }
    const newSaved = !isSaved;
    try {
      await fetch("/api/feed/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageId: image.id, save: newSaved }),
      });
      if (onSaveToggle) onSaveToggle(image.id, newSaved);
    } catch {
      // ignore
    }
  }

  return (
    <div className="image-card" onClick={handleCardClick}>
      <img src={imageUrl} alt={image.prompt} className="image-card__img" />
      <div className="image-card__footer">
        <div className="image-card__author">
          {authorAvatar ? (
            <Image
              src={authorAvatar}
              alt={authorName ?? "User"}
              width={24}
              height={24}
              className="image-card__author-avatar"
            />
          ) : (
            <div className="image-card__author-placeholder">
              {authorName?.[0] ?? "U"}
            </div>
          )}
          <span className="image-card__author-name">{authorName ?? "Unknown"}</span>
        </div>
        <button
          className={`image-card__bookmark ${isSaved ? "image-card__bookmark--saved" : ""}`}
          onClick={handleBookmark}
          title={isSaved ? "Remove from collection" : "Save to collection"}
        >
          <Image src="/resources/bookmark.svg" alt="Bookmark" width={14} height={14} />
        </button>
      </div>
    </div>
  );
}
