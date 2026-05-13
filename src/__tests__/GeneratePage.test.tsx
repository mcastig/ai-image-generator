import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

const mockUseSession = jest.fn();
jest.mock("next-auth/react", () => ({ useSession: mockUseSession }));
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} />,
}));

import GeneratePage from "@/components/GeneratePage/GeneratePage";
import { useStore } from "@/store/useStore";
import { RESOLUTIONS, COLOR_OPTIONS } from "@/types";

beforeEach(() => {
  useStore.setState({ showSignInModal: false });
  mockUseSession.mockReturnValue({ data: { user: { id: "u1" } } });
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: jest.fn().mockResolvedValue({ image: { id: "1", image_url: "data:image/png;base64,abc", prompt: "a cat" } }),
  });
});

describe("GeneratePage rendering", () => {
  it("renders prompt textarea", () => {
    render(<GeneratePage />);
    expect(screen.getAllByPlaceholderText("Enter the prompt").length).toBeGreaterThanOrEqual(1);
  });

  it("renders all resolution pills", () => {
    render(<GeneratePage />);
    for (const r of RESOLUTIONS) {
      expect(screen.getByText(r.label)).toBeInTheDocument();
    }
  });

  it("renders all color swatches", () => {
    render(<GeneratePage />);
    const swatches = document.querySelectorAll(".generate-page__color-swatch");
    expect(swatches.length).toBe(COLOR_OPTIONS.length);
  });

  it("renders guidance slider", () => {
    render(<GeneratePage />);
    const slider = document.querySelector('input[type="range"]') as HTMLInputElement;
    expect(slider).toBeInTheDocument();
    expect(slider.value).toBe("5");
  });

  it("renders generate button", () => {
    render(<GeneratePage />);
    expect(screen.getByText("Generate Image")).toBeInTheDocument();
  });
});

describe("GeneratePage with prefillSettings", () => {
  it("prefills prompt from settings", () => {
    render(<GeneratePage prefillSettings={{ prompt: "a dog" }} />);
    const textarea = screen.getAllByPlaceholderText("Enter the prompt")[0] as HTMLTextAreaElement;
    expect(textarea.value).toBe("a dog");
  });

  it("prefills resolution from settings", () => {
    render(<GeneratePage prefillSettings={{ resolution: "896x1152" }} />);
    const activeResolution = document.querySelector(".generate-page__resolution-pill--active");
    expect(activeResolution?.textContent).toBe("896 × 1152 (7:9)");
  });

  it("prefills negativePrompt and color from settings", () => {
    render(<GeneratePage prefillSettings={{ negativePrompt: "blurry", color: "#DD524C" }} />);
    const negTextarea = screen.getAllByPlaceholderText("Enter the prompt")[1] as HTMLTextAreaElement;
    expect(negTextarea.value).toBe("blurry");
    expect(document.querySelector(".generate-page__color-swatch--active")).toBeInTheDocument();
  });

  it("prefills guidance from settings", () => {
    render(<GeneratePage prefillSettings={{ guidance: 8 }} />);
    const slider = document.querySelector('input[type="range"]') as HTMLInputElement;
    expect(slider.value).toBe("8");
  });
});

describe("GeneratePage interactions", () => {
  it("shows sign-in modal when unauthenticated user clicks generate", async () => {
    mockUseSession.mockReturnValueOnce({ data: null });
    render(<GeneratePage />);
    fireEvent.click(screen.getByText("Generate Image"));
    expect(useStore.getState().showSignInModal).toBe(true);
  });

  it("shows error when prompt is empty", async () => {
    render(<GeneratePage />);
    fireEvent.click(screen.getByText("Generate Image"));
    await waitFor(() => {
      expect(screen.getByText("Please enter a prompt.")).toBeInTheDocument();
    });
  });

  it("submits form and shows generated image", async () => {
    render(<GeneratePage />);
    const textarea = screen.getAllByPlaceholderText("Enter the prompt")[0];
    fireEvent.change(textarea, { target: { value: "a cat" } });
    fireEvent.click(screen.getByText("Generate Image"));

    await waitFor(() => {
      const img = document.querySelector(".generate-page__preview-img") as HTMLImageElement;
      expect(img).toBeInTheDocument();
    });
  });

  it("shows 'Generation failed' when res.ok=false and no error message", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: jest.fn().mockResolvedValue({}),
    });
    render(<GeneratePage />);
    const textarea = screen.getAllByPlaceholderText("Enter the prompt")[0];
    fireEvent.change(textarea, { target: { value: "a cat" } });
    fireEvent.click(screen.getByText("Generate Image"));
    await waitFor(() => {
      expect(screen.getByText("Generation failed")).toBeInTheDocument();
    });
  });

  it("shows error message on failed generation", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: jest.fn().mockResolvedValue({ error: "Model overloaded" }),
    });
    render(<GeneratePage />);
    const textarea = screen.getAllByPlaceholderText("Enter the prompt")[0];
    fireEvent.change(textarea, { target: { value: "a cat" } });
    fireEvent.click(screen.getByText("Generate Image"));

    await waitFor(() => {
      expect(screen.getByText("Model overloaded")).toBeInTheDocument();
    });
  });

  it("shows generic error on fetch exception", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));
    render(<GeneratePage />);
    const textarea = screen.getAllByPlaceholderText("Enter the prompt")[0];
    fireEvent.change(textarea, { target: { value: "a cat" } });
    fireEvent.click(screen.getByText("Generate Image"));

    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });
  });

  it("shows 'Something went wrong' for non-Error throws", async () => {
    global.fetch = jest.fn().mockRejectedValue("string error");
    render(<GeneratePage />);
    const textarea = screen.getAllByPlaceholderText("Enter the prompt")[0];
    fireEvent.change(textarea, { target: { value: "a cat" } });
    fireEvent.click(screen.getByText("Generate Image"));

    await waitFor(() => {
      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    });
  });

  it("toggles color swatch on/off", () => {
    render(<GeneratePage />);
    const swatches = document.querySelectorAll(".generate-page__color-swatch");
    const first = swatches[0] as HTMLElement;
    fireEvent.click(first);
    expect(first.classList.contains("generate-page__color-swatch--active")).toBe(true);
    fireEvent.click(first);
    expect(first.classList.contains("generate-page__color-swatch--active")).toBe(false);
  });

  it("clears color when clear button is clicked", () => {
    render(<GeneratePage />);
    const swatches = document.querySelectorAll(".generate-page__color-swatch");
    fireEvent.click(swatches[0] as HTMLElement);
    const clearBtn = document.querySelector(".generate-page__color-clear") as HTMLElement;
    fireEvent.click(clearBtn);
    const activeSwatches = document.querySelectorAll(".generate-page__color-swatch--active");
    expect(activeSwatches.length).toBe(0);
  });

  it("changes resolution when pill is clicked", () => {
    render(<GeneratePage />);
    const pills = document.querySelectorAll(".generate-page__resolution-pill");
    fireEvent.click(pills[1] as HTMLElement);
    expect(pills[1].classList.contains("generate-page__resolution-pill--active")).toBe(true);
  });

  it("changes negative prompt textarea value", () => {
    render(<GeneratePage />);
    const negTextarea = screen.getAllByPlaceholderText("Enter the prompt")[1] as HTMLTextAreaElement;
    fireEvent.change(negTextarea, { target: { value: "blurry" } });
    expect(negTextarea.value).toBe("blurry");
  });

  it("changes guidance when range input changes", () => {
    render(<GeneratePage />);
    const slider = document.querySelector('input[type="range"]') as HTMLInputElement;
    fireEvent.change(slider, { target: { value: "8" } });
    expect(screen.getByText("Guidance (8.0)")).toBeInTheDocument();
  });

  it("calls onClearPrefill after successful generation", async () => {
    const onClearPrefill = jest.fn();
    render(<GeneratePage prefillSettings={{ prompt: "a cat" }} onClearPrefill={onClearPrefill} />);
    fireEvent.click(screen.getByText("Generate Image"));
    await waitFor(() => {
      expect(onClearPrefill).toHaveBeenCalled();
    });
  });

  it("shows empty src when generated image has neither image_url nor imageUrl", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ image: { id: "1", prompt: "a cat" } }),
    });
    render(<GeneratePage />);
    const textarea = screen.getAllByPlaceholderText("Enter the prompt")[0];
    fireEvent.change(textarea, { target: { value: "a cat" } });
    fireEvent.click(screen.getByText("Generate Image"));
    await waitFor(() => {
      const img = document.querySelector(".generate-page__preview-img") as HTMLImageElement;
      expect(img).toBeInTheDocument();
    });
  });

  it("shows generated image using camelCase imageUrl when image_url absent", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ image: { id: "1", imageUrl: "data:image/png;base64,camel", prompt: "a cat" } }),
    });
    render(<GeneratePage />);
    const textarea = screen.getAllByPlaceholderText("Enter the prompt")[0];
    fireEvent.change(textarea, { target: { value: "a cat" } });
    fireEvent.click(screen.getByText("Generate Image"));
    await waitFor(() => {
      const img = document.querySelector(".generate-page__preview-img") as HTMLImageElement;
      expect(img.src).toContain("camel");
    });
  });

  it("shows loading state during generation", async () => {
    let resolveGen: (v: unknown) => void;
    global.fetch = jest.fn().mockReturnValue(new Promise((res) => { resolveGen = res; }));
    render(<GeneratePage />);
    const textarea = screen.getAllByPlaceholderText("Enter the prompt")[0];
    fireEvent.change(textarea, { target: { value: "a cat" } });
    fireEvent.click(screen.getByText("Generate Image"));
    expect(screen.getByText("Generating...")).toBeInTheDocument();
    resolveGen!({ ok: true, json: () => Promise.resolve({ image: { id: "1", image_url: "" } }) });
    await waitFor(() => expect(screen.getByText("Generate Image")).toBeInTheDocument());
  });
});
