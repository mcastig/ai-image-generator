const mockTextToImage = jest.fn();

jest.mock("@huggingface/inference", () => ({
  HfInference: jest.fn().mockImplementation(() => ({
    textToImage: mockTextToImage,
  })),
}));

import { textToImageBase64, HF_MODEL } from "@/lib/hf";

beforeEach(() => {
  mockTextToImage.mockReset();
});

describe("HF_MODEL", () => {
  it("is FLUX.1-schnell", () => {
    expect(HF_MODEL).toBe("black-forest-labs/FLUX.1-schnell");
  });
});

describe("textToImageBase64", () => {
  it("calls textToImage with correct model and parsed dimensions", async () => {
    mockTextToImage.mockResolvedValueOnce("data:image/png;base64,abc");
    await textToImageBase64("a cat", "1024x768");
    expect(mockTextToImage).toHaveBeenCalledWith(
      expect.objectContaining({
        model: HF_MODEL,
        inputs: "a cat",
        parameters: { width: 1024, height: 768 },
        provider: "hf-inference",
      }),
      { outputType: "dataUrl" }
    );
  });

  it("returns the data URL from the model", async () => {
    const expected = "data:image/png;base64,xyz";
    mockTextToImage.mockResolvedValueOnce(expected);
    const result = await textToImageBase64("a dog", "512x512");
    expect(result).toBe(expected);
  });

  it("defaults to 1024x1024 when resolution cannot be parsed", async () => {
    mockTextToImage.mockResolvedValueOnce("data:image/png;base64,def");
    await textToImageBase64("test", "badformat");
    expect(mockTextToImage).toHaveBeenCalledWith(
      expect.objectContaining({
        parameters: { width: 1024, height: 1024 },
      }),
      expect.anything()
    );
  });

  it("defaults to 1024x1024 when resolution is null/undefined (nullish coalescing branch)", async () => {
    mockTextToImage.mockResolvedValueOnce("data:image/png;base64,null");
    // @ts-expect-error testing null input
    await textToImageBase64("test", null);
    expect(mockTextToImage).toHaveBeenCalledWith(
      expect.objectContaining({ parameters: { width: 1024, height: 1024 } }),
      expect.anything()
    );
  });

  it("propagates errors from the HuggingFace client", async () => {
    mockTextToImage.mockRejectedValueOnce(new Error("rate limit"));
    await expect(textToImageBase64("x", "1024x1024")).rejects.toThrow("rate limit");
  });
});
