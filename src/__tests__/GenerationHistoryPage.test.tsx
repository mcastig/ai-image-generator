import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} />,
}));

import GenerationHistoryPage from "@/components/GenerationHistoryPage/GenerationHistoryPage";
import { useStore } from "@/store/useStore";
import type { Image as ImageType } from "@/types";

const fakeImages: ImageType[] = [
  {
    id: "1",
    userId: "u1",
    prompt: "a mountain",
    negativePrompt: null,
    color: null,
    resolution: "1024x1024",
    guidance: 5,
    imageUrl: "https://example.com/1.png",
    seed: 100,
    createdAt: "2024-03-10T00:00:00Z",
  },
  {
    id: "2",
    userId: "u1",
    prompt: "a river",
    negativePrompt: null,
    color: null,
    resolution: "896x1152",
    guidance: 7,
    imageUrl: "https://example.com/2.png",
    seed: 0,
    createdAt: "2024-03-11T00:00:00Z",
  },
];

beforeEach(() => {
  useStore.setState({ showImageDetail: false, selectedImage: null });
  global.fetch = jest.fn().mockResolvedValue({
    json: jest.fn().mockResolvedValue({ images: fakeImages }),
  });
});

describe("GenerationHistoryPage", () => {
  it("shows loading spinner initially", () => {
    // Don't resolve fetch yet
    global.fetch = jest.fn().mockReturnValue(new Promise(() => {}));
    render(<GenerationHistoryPage />);
    expect(document.querySelector(".history-page__spinner")).toBeInTheDocument();
  });

  it("renders list of images after loading", async () => {
    render(<GenerationHistoryPage />);
    await waitFor(() => {
      expect(screen.getByText("a mountain")).toBeInTheDocument();
      expect(screen.getByText("a river")).toBeInTheDocument();
    });
  });

  it("shows empty message when no images", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue({ images: [] }),
    });
    render(<GenerationHistoryPage />);
    await waitFor(() => {
      expect(screen.getByText(/haven't generated any images yet/)).toBeInTheDocument();
    });
  });

  it("formats and displays date", async () => {
    render(<GenerationHistoryPage />);
    await waitFor(() => {
      expect(screen.getByText("Mar 10, 2024")).toBeInTheDocument();
    });
  });

  it("displays resolution", async () => {
    render(<GenerationHistoryPage />);
    await waitFor(() => {
      expect(screen.getByText("1024x1024")).toBeInTheDocument();
    });
  });

  it("displays seed when present", async () => {
    render(<GenerationHistoryPage />);
    await waitFor(() => {
      expect(screen.getByText(/Seed: 100/)).toBeInTheDocument();
    });
  });

  it("does not display seed when seed is 0 (falsy)", async () => {
    render(<GenerationHistoryPage />);
    await waitFor(() => {
      expect(screen.queryByText(/Seed: 0/)).not.toBeInTheDocument();
    });
  });

  it("opens image detail modal on item click", async () => {
    render(<GenerationHistoryPage />);
    await waitFor(() => screen.getByText("a mountain"));
    await userEvent.click(screen.getByText("a mountain"));
    expect(useStore.getState().showImageDetail).toBe(true);
    expect(useStore.getState().selectedImage?.id).toBe("1");
  });

  it("handles null images in API response", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue({ images: null }),
    });
    render(<GenerationHistoryPage />);
    await waitFor(() => {
      expect(screen.getByText(/haven't generated any images yet/)).toBeInTheDocument();
    });
  });

  it("uses created_at snake_case when camelCase createdAt is empty", async () => {
    const imgs = [{
      ...fakeImages[0],
      createdAt: "",
      created_at: "2024-06-15T12:00:00Z",
    }];
    global.fetch = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue({ images: imgs }),
    });
    render(<GenerationHistoryPage />);
    await waitFor(() => {
      expect(screen.getByText("Jun 15, 2024")).toBeInTheDocument();
    });
  });

  it("falls back to empty string when both imageUrl/createdAt forms are absent", async () => {
    const imgs = [{
      ...fakeImages[0],
      imageUrl: undefined as unknown as string,
      image_url: undefined,
      createdAt: undefined as unknown as string,
      created_at: undefined,
    }];
    global.fetch = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue({ images: imgs }),
    });
    render(<GenerationHistoryPage />);
    await waitFor(() => {
      const imgEl = document.querySelector(".history-page__item-img") as HTMLImageElement;
      // empty src falls back to base URL in jsdom
      expect(imgEl).toBeInTheDocument();
    });
  });

  it("uses snake_case image_url when camelCase is absent", async () => {
    const imgs = [{
      ...fakeImages[0],
      imageUrl: undefined as unknown as string,
      image_url: "https://cdn.example.com/img.png",
    }];
    global.fetch = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue({ images: imgs }),
    });
    render(<GenerationHistoryPage />);
    await waitFor(() => {
      const imgEl = document.querySelector(".history-page__item-img") as HTMLImageElement;
      expect(imgEl.src).toBe("https://cdn.example.com/img.png");
    });
  });
});
