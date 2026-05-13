import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} />,
}));

import ImageDetailModal from "@/components/ImageDetailModal/ImageDetailModal";
import { useStore } from "@/store/useStore";
import type { Image as ImageType } from "@/types";

const mockImage: ImageType = {
  id: "img1",
  userId: "u1",
  prompt: "a beautiful mountain",
  negativePrompt: "blurry",
  color: "#FF0000",
  resolution: "1024x1024",
  guidance: 7,
  imageUrl: "https://example.com/img.png",
  seed: 42,
  createdAt: "2024-03-15T00:00:00Z",
};

beforeEach(() => {
  useStore.setState({
    showImageDetail: true,
    selectedImage: mockImage,
  });
});

describe("ImageDetailModal", () => {
  it("renders the prompt", () => {
    const onGen = jest.fn();
    render(<ImageDetailModal image={mockImage} onGenerateWithSettings={onGen} />);
    expect(screen.getByText("a beautiful mountain")).toBeInTheDocument();
  });

  it("renders the negative prompt", () => {
    const onGen = jest.fn();
    render(<ImageDetailModal image={mockImage} onGenerateWithSettings={onGen} />);
    expect(screen.getByText("blurry")).toBeInTheDocument();
  });

  it("renders 'Null' when no negative prompt", () => {
    const onGen = jest.fn();
    render(<ImageDetailModal image={{ ...mockImage, negativePrompt: null }} onGenerateWithSettings={onGen} />);
    expect(screen.getByText("Null")).toBeInTheDocument();
  });

  it("renders the resolution", () => {
    const onGen = jest.fn();
    render(<ImageDetailModal image={mockImage} onGenerateWithSettings={onGen} />);
    expect(screen.getByText("1024x1024")).toBeInTheDocument();
  });

  it("renders the seed", () => {
    const onGen = jest.fn();
    render(<ImageDetailModal image={mockImage} onGenerateWithSettings={onGen} />);
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("renders '—' when seed is null", () => {
    const onGen = jest.fn();
    render(<ImageDetailModal image={{ ...mockImage, seed: null }} onGenerateWithSettings={onGen} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("formats the date correctly", () => {
    const onGen = jest.fn();
    // Use a noon UTC time so local timezone doesn't shift the day
    const img = { ...mockImage, createdAt: "2024-03-15T12:00:00Z" };
    render(<ImageDetailModal image={img} onGenerateWithSettings={onGen} />);
    expect(screen.getByText("March 15, 2024")).toBeInTheDocument();
  });

  it("renders '—' when createdAt is missing", () => {
    const onGen = jest.fn();
    render(<ImageDetailModal image={{ ...mockImage, createdAt: "", created_at: undefined }} onGenerateWithSettings={onGen} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("closes modal when overlay is clicked", () => {
    const onGen = jest.fn();
    render(<ImageDetailModal image={mockImage} onGenerateWithSettings={onGen} />);
    const overlay = document.querySelector(".image-detail-overlay") as HTMLElement;
    fireEvent.click(overlay);
    expect(useStore.getState().showImageDetail).toBe(false);
    expect(useStore.getState().selectedImage).toBeNull();
  });

  it("does not close when clicking modal content", () => {
    const onGen = jest.fn();
    render(<ImageDetailModal image={mockImage} onGenerateWithSettings={onGen} />);
    const modal = document.querySelector(".image-detail-modal") as HTMLElement;
    fireEvent.click(modal);
    expect(useStore.getState().showImageDetail).toBe(true);
  });

  it("closes modal when close button is clicked", () => {
    const onGen = jest.fn();
    render(<ImageDetailModal image={mockImage} onGenerateWithSettings={onGen} />);
    const closeBtn = document.querySelector(".image-detail-modal__close") as HTMLElement;
    fireEvent.click(closeBtn);
    expect(useStore.getState().showImageDetail).toBe(false);
  });

  it("calls onGenerateWithSettings and closes detail when button is clicked", () => {
    const onGen = jest.fn();
    render(<ImageDetailModal image={mockImage} onGenerateWithSettings={onGen} />);
    fireEvent.click(screen.getByText("Generate with this settings"));
    expect(onGen).toHaveBeenCalledWith(mockImage);
    expect(useStore.getState().showImageDetail).toBe(false);
  });

  it("uses image_url when imageUrl is absent", () => {
    const onGen = jest.fn();
    const img = { ...mockImage, imageUrl: undefined as unknown as string, image_url: "https://cdn.example.com/img.png" };
    render(<ImageDetailModal image={img} onGenerateWithSettings={onGen} />);
    const imgEl = document.querySelector(".image-detail-modal__image") as HTMLImageElement;
    expect(imgEl.src).toBe("https://cdn.example.com/img.png");
  });

  it("uses created_at (snake_case) when camelCase createdAt is blank", () => {
    const onGen = jest.fn();
    const img = { ...mockImage, createdAt: "", created_at: "2024-01-05T12:00:00Z" };
    render(<ImageDetailModal image={img} onGenerateWithSettings={onGen} />);
    expect(screen.getByText("January 5, 2024")).toBeInTheDocument();
  });

  it("falls back to empty string when both image_url and imageUrl are absent", () => {
    const onGen = jest.fn();
    const img = { ...mockImage, imageUrl: undefined as unknown as string, image_url: undefined };
    render(<ImageDetailModal image={img} onGenerateWithSettings={onGen} />);
    const imgEl = document.querySelector(".image-detail-modal__image") as HTMLImageElement;
    expect(imgEl.src).toBe("");
  });

  it("uses negative_prompt (snake_case) when camelCase is absent", () => {
    const onGen = jest.fn();
    const img = { ...mockImage, negativePrompt: null, negative_prompt: "ugly" };
    render(<ImageDetailModal image={img} onGenerateWithSettings={onGen} />);
    expect(screen.getByText("ugly")).toBeInTheDocument();
  });
});

describe("ImageDetailModal handleDownload", () => {
  it("falls back to window.open on fetch error", async () => {
    const onGen = jest.fn();
    global.fetch = jest.fn().mockRejectedValueOnce(new Error("net error"));
    const openSpy = jest.spyOn(window, "open").mockImplementation(() => null);

    render(<ImageDetailModal image={mockImage} onGenerateWithSettings={onGen} />);
    const downloadBtn = document.querySelector(".image-detail-modal__download") as HTMLElement;
    fireEvent.click(downloadBtn);

    await new Promise((r) => setTimeout(r, 10));
    expect(openSpy).toHaveBeenCalledWith(mockImage.imageUrl, "_blank");
    openSpy.mockRestore();
  });

  it("downloads the image on success", async () => {
    const onGen = jest.fn();
    const fakeBlob = new Blob(["data"], { type: "image/png" });
    global.fetch = jest.fn().mockResolvedValueOnce({ blob: () => Promise.resolve(fakeBlob) });
    const fakeObjectUrl = "blob:fake-url";
    global.URL.createObjectURL = jest.fn().mockReturnValue(fakeObjectUrl);
    global.URL.revokeObjectURL = jest.fn();

    render(<ImageDetailModal image={mockImage} onGenerateWithSettings={onGen} />);
    const downloadBtn = document.querySelector(".image-detail-modal__download") as HTMLElement;
    fireEvent.click(downloadBtn);

    await new Promise((r) => setTimeout(r, 10));
    expect(URL.createObjectURL).toHaveBeenCalledWith(fakeBlob);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(fakeObjectUrl);
  });
});
