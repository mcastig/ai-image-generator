import { HfInference } from "@huggingface/inference";

const hf = new HfInference(process.env.HUGGINGFACE_API_TOKEN);

export const HF_MODEL = "black-forest-labs/FLUX.1-schnell";

export async function textToImageBase64(
  prompt: string,
  resolution: string
): Promise<string> {
  const [widthStr, heightStr] = (resolution ?? "1024x1024").split("x");
  const width = parseInt(widthStr, 10) || 1024;
  const height = parseInt(heightStr, 10) || 1024;

  return hf.textToImage(
    { model: HF_MODEL, inputs: prompt, parameters: { width, height }, provider: "hf-inference" },
    { outputType: "dataUrl" }
  );
}
