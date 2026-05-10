"use client";

import Image from "next/image";
import { useStore } from "@/store/useStore";
import type { Image as ImageType } from "@/types";
import "./ImageDetailModal.css";

interface ImageDetailModalProps {
  image: ImageType;
  onGenerateWithSettings: (image: ImageType) => void;
}

export default function ImageDetailModal({ image, onGenerateWithSettings }: ImageDetailModalProps) {
  const { setShowImageDetail, setSelectedImage } = useStore();

  const imageUrl = image.image_url ?? image.imageUrl ?? "";
  const negativePrompt = image.negative_prompt ?? image.negativePrompt;
  const createdAt = image.created_at ?? image.createdAt;

  function handleClose() {
    setShowImageDetail(false);
    setSelectedImage(null);
  }

  async function handleDownload() {
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ai-image-${image.id}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      window.open(imageUrl, "_blank");
    }
  }

  function handleGenerateWithSettings() {
    setShowImageDetail(false);
    onGenerateWithSettings(image);
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  return (
    <div className="image-detail-overlay" onClick={handleClose}>
      <div className="image-detail-modal" onClick={(e) => e.stopPropagation()}>
        <button className="image-detail-modal__close" onClick={handleClose}>
          <Image src="/resources/Close.svg" alt="Close" width={18} height={18} />
        </button>

        <div className="image-detail-modal__content">
          <div className="image-detail-modal__image-wrap">
            <img src={imageUrl} alt={image.prompt} className="image-detail-modal__image" />
            <button className="image-detail-modal__download" onClick={handleDownload}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 1v9M4.5 7l3.5 3.5L11.5 7M2 14h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Download
            </button>
          </div>

          <div className="image-detail-modal__info">
            <div className="image-detail-modal__field">
              <span className="image-detail-modal__field-label">Prompt details</span>
              <p className="image-detail-modal__field-value">{image.prompt}</p>
            </div>

            <div className="image-detail-modal__field">
              <span className="image-detail-modal__field-label">Negative prompt</span>
              <p className="image-detail-modal__field-value">{negativePrompt || "Null"}</p>
            </div>

            <div className="image-detail-modal__field">
              <span className="image-detail-modal__field-label">Created on</span>
              <p className="image-detail-modal__field-value">
                {createdAt ? formatDate(createdAt) : "—"}
              </p>
            </div>

            <div className="image-detail-modal__field">
              <span className="image-detail-modal__field-label">Input Resolution</span>
              <p className="image-detail-modal__field-value">{image.resolution}</p>
            </div>

            <div className="image-detail-modal__field">
              <span className="image-detail-modal__field-label">Seed</span>
              <p className="image-detail-modal__field-value">{image.seed ?? "—"}</p>
            </div>

            <button
              className="image-detail-modal__generate-btn"
              onClick={handleGenerateWithSettings}
            >
              <Image src="/resources/Magic.svg" alt="" width={16} height={16} />
              Generate with this settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
