import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

const mockUseSession = jest.fn();
jest.mock("next-auth/react", () => ({ useSession: mockUseSession }));
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} />,
}));

import MyCollectionPage from "@/components/MyCollectionPage/MyCollectionPage";
import { useStore } from "@/store/useStore";
import type { Image as ImageType } from "@/types";

const fakeImages: ImageType[] = [
  {
    id: "1",
    userId: "u1",
    prompt: "a sunset",
    negativePrompt: null,
    color: null,
    resolution: "1024x1024",
    guidance: 5,
    imageUrl: "https://example.com/sunset.png",
    seed: 1,
    createdAt: "2024-01-01",
    isSaved: true,
  },
  {
    id: "2",
    userId: "u2",
    prompt: "a forest",
    negativePrompt: null,
    color: null,
    resolution: "1024x1024",
    guidance: 5,
    imageUrl: "https://example.com/forest.png",
    seed: 2,
    createdAt: "2024-01-02",
    isSaved: true,
  },
];

beforeEach(() => {
  useStore.setState({ showImageDetail: false, selectedImage: null });
  mockUseSession.mockReturnValue({ data: { user: { id: "u1" } } });
  global.fetch = jest.fn().mockResolvedValue({
    json: jest.fn().mockResolvedValue({ images: fakeImages }),
  });
});

describe("MyCollectionPage", () => {
  it("shows loading spinner initially", () => {
    global.fetch = jest.fn().mockReturnValue(new Promise(() => {}));
    render(<MyCollectionPage />);
    expect(document.querySelector(".collection-page__spinner")).toBeInTheDocument();
  });

  it("renders images after loading", async () => {
    render(<MyCollectionPage />);
    await waitFor(() => {
      expect(document.querySelectorAll(".image-card").length).toBe(2);
    });
  });

  it("handles null images response (falls back to empty array)", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue({ images: null }),
    });
    render(<MyCollectionPage />);
    await waitFor(() => {
      expect(screen.getByText(/No saved images yet/)).toBeInTheDocument();
    });
  });

  it("shows empty message when collection is empty", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue({ images: [] }),
    });
    render(<MyCollectionPage />);
    await waitFor(() => {
      expect(screen.getByText(/No saved images yet/)).toBeInTheDocument();
    });
  });

  it("removes image from list when bookmark is clicked (unsave)", async () => {
    render(<MyCollectionPage />);
    await waitFor(() => {
      expect(document.querySelectorAll(".image-card").length).toBe(2);
    });

    // Bookmark click on a saved image will call onSaveToggle(id, false) -> remove from list
    global.fetch = jest.fn().mockResolvedValue({ ok: true });
    const bookmarks = document.querySelectorAll(".image-card__bookmark");
    fireEvent.click(bookmarks[0] as HTMLElement);

    await waitFor(() => {
      expect(document.querySelectorAll(".image-card").length).toBe(1);
    });
  });

  it("does not remove image when onSaveToggle is called with saved=true (no-op branch)", async () => {
    // Use images with isSaved=false so clicking bookmark calls onSaveToggle(id, true)
    const unsavedImages = fakeImages.map((img) => ({ ...img, isSaved: false, is_saved: false }));
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ json: jest.fn().mockResolvedValue({ images: unsavedImages }) })
      .mockResolvedValue({ ok: true });
    render(<MyCollectionPage />);
    await waitFor(() => {
      expect(document.querySelectorAll(".image-card").length).toBe(2);
    });
    // Click bookmark — isSaved=false -> newSaved=true -> onSaveToggle(id, true) -> no removal
    const bookmarks = document.querySelectorAll(".image-card__bookmark");
    fireEvent.click(bookmarks[0] as HTMLElement);
    await waitFor(() => {
      expect(document.querySelectorAll(".image-card").length).toBe(2);
    });
  });
});
