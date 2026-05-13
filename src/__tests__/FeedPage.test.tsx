import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

const mockUseSession = jest.fn();
jest.mock("next-auth/react", () => ({ useSession: mockUseSession }));
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} />,
}));

import FeedPage from "@/components/FeedPage/FeedPage";
import type { Image as ImageType } from "@/types";

const fakeImages: ImageType[] = [
  {
    id: "1",
    userId: "u1",
    prompt: "a mountain lake",
    negativePrompt: null,
    color: null,
    resolution: "1024x1024",
    guidance: 5,
    imageUrl: "https://example.com/1.png",
    seed: 1,
    createdAt: "2024-01-01",
    isSaved: false,
  },
  {
    id: "2",
    userId: "u2",
    prompt: "a forest river",
    negativePrompt: null,
    color: null,
    resolution: "1024x1024",
    guidance: 5,
    imageUrl: "https://example.com/2.png",
    seed: 2,
    createdAt: "2024-01-02",
    isSaved: false,
  },
];

beforeEach(() => {
  mockUseSession.mockReturnValue({ data: null });
  global.fetch = jest.fn().mockResolvedValue({
    json: jest.fn().mockResolvedValue({ images: fakeImages }),
  });
});

describe("FeedPage", () => {
  it("shows loading spinner initially", () => {
    global.fetch = jest.fn().mockReturnValue(new Promise(() => {}));
    render(<FeedPage />);
    expect(document.querySelector(".feed-page__spinner")).toBeInTheDocument();
  });

  it("renders images after loading", async () => {
    render(<FeedPage />);
    await waitFor(() => {
      expect(screen.getByAltText("a mountain lake")).toBeInTheDocument();
    });
  });

  it("shows empty state when no images", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue({ images: [] }),
    });
    render(<FeedPage />);
    await waitFor(() => {
      expect(screen.getByText(/No images yet/)).toBeInTheDocument();
    });
  });

  it("handles null images in API response gracefully", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue({ images: null }),
    });
    render(<FeedPage />);
    await waitFor(() => {
      expect(screen.getByText(/No images yet/)).toBeInTheDocument();
    });
  });

  it("shows search-specific empty state after searching", async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ json: jest.fn().mockResolvedValue({ images: [] }) })
      .mockResolvedValueOnce({ json: jest.fn().mockResolvedValue({ images: [] }) });
    render(<FeedPage />);
    await waitFor(() => screen.getByPlaceholderText("Search images by keywords"));
    const input = screen.getByPlaceholderText("Search images by keywords");
    fireEvent.change(input, { target: { value: "unicorn" } });
    fireEvent.submit(input.closest("form") as HTMLElement);
    await waitFor(() => {
      expect(screen.getByText(/No results for "unicorn"/)).toBeInTheDocument();
    });
  });

  it("fetches with query param when searching", async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ json: jest.fn().mockResolvedValue({ images: fakeImages }) })
      .mockResolvedValueOnce({ json: jest.fn().mockResolvedValue({ images: [] }) });
    render(<FeedPage />);
    await waitFor(() => screen.getByPlaceholderText("Search images by keywords"));
    const input = screen.getByPlaceholderText("Search images by keywords");
    fireEvent.change(input, { target: { value: "mountain" } });
    fireEvent.submit(input.closest("form") as HTMLElement);
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("q=mountain"));
    });
  });

  it("handleSaveToggle updates isSaved on the matching image", async () => {
    mockUseSession.mockReturnValue({ data: { user: { id: "u1" } } });
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ json: jest.fn().mockResolvedValue({ images: fakeImages }) })
      .mockResolvedValueOnce({ ok: true });
    render(<FeedPage />);
    await waitFor(() => screen.getByAltText("a mountain lake"));
    const bookmark = document.querySelector(".image-card__bookmark") as HTMLElement;
    fireEvent.click(bookmark);
    await waitFor(() => {
      expect(document.querySelector(".image-card__bookmark--saved")).toBeInTheDocument();
    });
  });
});
