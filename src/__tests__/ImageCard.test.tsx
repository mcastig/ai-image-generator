import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

const mockUseSession = jest.fn();
jest.mock("next-auth/react", () => ({ useSession: mockUseSession }));
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} />,
}));

import ImageCard from "@/components/ImageCard/ImageCard";
import { useStore } from "@/store/useStore";
import type { Image as ImageType } from "@/types";

const baseImage: ImageType = {
  id: "img1",
  userId: "u1",
  prompt: "a cat",
  negativePrompt: null,
  color: null,
  resolution: "1024x1024",
  guidance: 5,
  imageUrl: "https://example.com/cat.png",
  seed: 1,
  createdAt: "2024-01-01",
  authorName: "Alice",
  authorAvatar: "https://avatars.githubusercontent.com/u/1",
  isSaved: false,
};

beforeEach(() => {
  useStore.setState({
    showSignInModal: false,
    showImageDetail: false,
    selectedImage: null,
  });
  mockUseSession.mockReturnValue({ data: { user: { id: "u1" } } });
  global.fetch = jest.fn().mockResolvedValue({ ok: true });
});

describe("ImageCard rendering", () => {
  it("renders the image", () => {
    render(<ImageCard image={baseImage} />);
    const img = document.querySelector(".image-card__img") as HTMLImageElement;
    expect(img.src).toBe("https://example.com/cat.png");
  });

  it("renders author name", () => {
    render(<ImageCard image={baseImage} />);
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("renders placeholder when authorAvatar is null", () => {
    render(<ImageCard image={{ ...baseImage, authorAvatar: null, author_avatar: undefined }} />);
    const placeholder = document.querySelector(".image-card__author-placeholder");
    expect(placeholder).toBeInTheDocument();
    expect(placeholder?.textContent).toBe("A");
  });

  it("renders 'U' placeholder when author name is also null", () => {
    render(<ImageCard image={{ ...baseImage, authorName: null, authorAvatar: null, author_avatar: undefined, author_name: undefined }} />);
    const placeholder = document.querySelector(".image-card__author-placeholder");
    expect(placeholder?.textContent).toBe("U");
  });

  it("renders 'Unknown' when authorName is null", () => {
    render(<ImageCard image={{ ...baseImage, authorName: null, author_name: undefined }} />);
    expect(screen.getByText("Unknown")).toBeInTheDocument();
  });

  it("shows saved state on bookmark button", () => {
    render(<ImageCard image={{ ...baseImage, isSaved: true }} />);
    const btn = document.querySelector(".image-card__bookmark--saved");
    expect(btn).toBeInTheDocument();
  });

  it("falls back to empty string when both image_url and imageUrl are absent", () => {
    const img = { ...baseImage, imageUrl: undefined as unknown as string, image_url: undefined };
    render(<ImageCard image={img} />);
    const imgEl = document.querySelector(".image-card__img") as HTMLImageElement;
    // jsdom renders an empty src as "" (not resolved to localhost)
    expect(imgEl.src).toBe("");
  });

  it("uses snake_case author_name when both are present", () => {
    const img = { ...baseImage, author_name: "Bob", author_avatar: "https://avatars.github.com/u/2" };
    render(<ImageCard image={img} />);
    // author_name takes priority over authorName via ??
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("uses snake_case image_url when camelCase is absent", () => {
    const img = { ...baseImage, imageUrl: undefined as unknown as string, image_url: "https://cdn.example.com/img.png" };
    render(<ImageCard image={img} />);
    const imgEl = document.querySelector(".image-card__img") as HTMLImageElement;
    expect(imgEl.src).toBe("https://cdn.example.com/img.png");
  });
});

describe("ImageCard interaction", () => {
  it("opens image detail on card click", () => {
    render(<ImageCard image={baseImage} />);
    fireEvent.click(document.querySelector(".image-card") as HTMLElement);
    expect(useStore.getState().showImageDetail).toBe(true);
    expect(useStore.getState().selectedImage).toEqual(baseImage);
  });

  it("toggles bookmark and calls onSaveToggle", async () => {
    const onSaveToggle = jest.fn();
    render(<ImageCard image={baseImage} onSaveToggle={onSaveToggle} />);
    const bookmark = document.querySelector(".image-card__bookmark") as HTMLElement;
    fireEvent.click(bookmark);

    await Promise.resolve();
    await Promise.resolve();

    expect(global.fetch).toHaveBeenCalledWith("/api/feed/save", expect.objectContaining({
      method: "POST",
    }));
    expect(onSaveToggle).toHaveBeenCalledWith("img1", true);
  });

  it("shows sign-in modal when unauthenticated user tries to bookmark", async () => {
    mockUseSession.mockReturnValueOnce({ data: null });
    render(<ImageCard image={baseImage} />);
    const bookmark = document.querySelector(".image-card__bookmark") as HTMLElement;
    fireEvent.click(bookmark);
    expect(useStore.getState().showSignInModal).toBe(true);
  });

  it("does not propagate bookmark click to card", () => {
    render(<ImageCard image={baseImage} />);
    const bookmark = document.querySelector(".image-card__bookmark") as HTMLElement;
    fireEvent.click(bookmark);
    // showImageDetail should remain false because stopPropagation was called
    expect(useStore.getState().showImageDetail).toBe(false);
  });
});
