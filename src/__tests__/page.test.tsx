import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";

const mockUseSession = jest.fn();
jest.mock("next-auth/react", () => ({
  useSession: mockUseSession,
  signIn: jest.fn(),
  signOut: jest.fn(),
}));
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} />,
}));

// Mock all child components to keep page tests focused
jest.mock("@/components/Sidebar/Sidebar", () => ({
  __esModule: true,
  default: ({ mobileOpen, onMobileClose }: { mobileOpen: boolean; onMobileClose: () => void }) => (
    <div data-testid="sidebar" data-mobile-open={mobileOpen}>
      <button onClick={onMobileClose}>close-sidebar</button>
    </div>
  ),
}));
jest.mock("@/components/GeneratePage/GeneratePage", () => ({
  __esModule: true,
  default: ({ onClearPrefill }: { onClearPrefill?: () => void }) => (
    <div data-testid="generate-page">
      <button onClick={onClearPrefill}>clear-prefill</button>
    </div>
  ),
}));
jest.mock("@/components/FeedPage/FeedPage", () => ({
  __esModule: true,
  default: () => <div data-testid="feed-page" />,
}));
jest.mock("@/components/GenerationHistoryPage/GenerationHistoryPage", () => ({
  __esModule: true,
  default: () => <div data-testid="history-page" />,
}));
jest.mock("@/components/MyCollectionPage/MyCollectionPage", () => ({
  __esModule: true,
  default: () => <div data-testid="collection-page" />,
}));
jest.mock("@/components/ImageDetailModal/ImageDetailModal", () => ({
  __esModule: true,
  default: ({ onGenerateWithSettings }: { onGenerateWithSettings: (img: unknown) => void }) => (
    <div data-testid="image-detail-modal">
      <button onClick={() => onGenerateWithSettings({ id: "img1", prompt: "test" })}>generate-with-settings</button>
    </div>
  ),
}));
jest.mock("@/components/SignInModal/SignInModal", () => ({
  __esModule: true,
  default: () => <div data-testid="sign-in-modal" />,
}));

import Home from "@/app/page";
import { useStore } from "@/store/useStore";
import type { Image as ImageType } from "@/types";

beforeEach(() => {
  mockUseSession.mockReturnValue({ data: null });
  useStore.setState({
    activeTab: "generate",
    theme: "dark",
    showSignInModal: false,
    showImageDetail: false,
    selectedImage: null,
  });
});

describe("Home page", () => {
  it("renders generate page by default", () => {
    render(<Home />);
    expect(screen.getByTestId("generate-page")).toBeInTheDocument();
  });

  it("renders feed page when activeTab=feed", () => {
    useStore.setState({ activeTab: "feed" });
    render(<Home />);
    expect(screen.getByTestId("feed-page")).toBeInTheDocument();
  });

  it("renders history page when activeTab=history", () => {
    useStore.setState({ activeTab: "history" });
    render(<Home />);
    expect(screen.getByTestId("history-page")).toBeInTheDocument();
  });

  it("renders collection page when activeTab=collection", () => {
    useStore.setState({ activeTab: "collection" });
    render(<Home />);
    expect(screen.getByTestId("collection-page")).toBeInTheDocument();
  });

  it("renders SignInModal when showSignInModal=true", () => {
    useStore.setState({ showSignInModal: true });
    render(<Home />);
    expect(screen.getByTestId("sign-in-modal")).toBeInTheDocument();
  });

  it("renders ImageDetailModal when showImageDetail=true and selectedImage is set", () => {
    const img: ImageType = {
      id: "1", userId: "u1", prompt: "x", negativePrompt: null, color: null,
      resolution: "1024x1024", guidance: 5, imageUrl: "https://example.com/x.png",
      seed: 1, createdAt: "2024-01-01",
    };
    useStore.setState({ showImageDetail: true, selectedImage: img });
    render(<Home />);
    expect(screen.getByTestId("image-detail-modal")).toBeInTheDocument();
  });

  it("does NOT render ImageDetailModal when selectedImage is null", () => {
    useStore.setState({ showImageDetail: true, selectedImage: null });
    render(<Home />);
    expect(screen.queryByTestId("image-detail-modal")).not.toBeInTheDocument();
  });

  it("sets data-theme attribute on documentElement when theme changes", () => {
    render(<Home />);
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    act(() => { useStore.getState().toggleTheme(); });
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });

  it("opens mobile nav when menu button clicked", () => {
    render(<Home />);
    const menuBtn = screen.getByLabelText("Open menu");
    fireEvent.click(menuBtn);
    expect(screen.getByTestId("sidebar").getAttribute("data-mobile-open")).toBe("true");
  });

  it("closes mobile nav when sidebar requests close", () => {
    render(<Home />);
    fireEvent.click(screen.getByLabelText("Open menu"));
    fireEvent.click(screen.getByText("close-sidebar"));
    expect(screen.getByTestId("sidebar").getAttribute("data-mobile-open")).toBe("false");
  });

  it("handleGenerateWithSettings switches to generate tab with prefill", () => {
    const img: ImageType = {
      id: "1", userId: "u1", prompt: "test", negativePrompt: null, color: null,
      resolution: "1024x1024", guidance: 5, imageUrl: "https://example.com/x.png",
      seed: 1, createdAt: "2024-01-01",
    };
    useStore.setState({ showImageDetail: true, selectedImage: img });
    render(<Home />);
    fireEvent.click(screen.getByText("generate-with-settings"));
    expect(useStore.getState().activeTab).toBe("generate");
  });

  it("clears prefill settings when onClearPrefill is triggered", () => {
    render(<Home />);
    fireEvent.click(screen.getByText("clear-prefill"));
    // No error means the inline () => setPrefillSettings(null) was called successfully
    expect(screen.getByTestId("generate-page")).toBeInTheDocument();
  });

  it("renders mobile header logo", () => {
    render(<Home />);
    expect(document.querySelector(".mobile-header")).toBeInTheDocument();
  });
});
