import { useStore } from "@/store/useStore";
import type { Image } from "@/types";

function getState() {
  return useStore.getState();
}

beforeEach(() => {
  useStore.setState({
    activeTab: "generate",
    theme: "dark",
    selectedImage: null,
    showSignInModal: false,
    showImageDetail: false,
  });
});

describe("useStore initial state", () => {
  it("activeTab defaults to generate", () => {
    expect(getState().activeTab).toBe("generate");
  });

  it("theme defaults to dark", () => {
    expect(getState().theme).toBe("dark");
  });

  it("selectedImage defaults to null", () => {
    expect(getState().selectedImage).toBeNull();
  });

  it("showSignInModal defaults to false", () => {
    expect(getState().showSignInModal).toBe(false);
  });

  it("showImageDetail defaults to false", () => {
    expect(getState().showImageDetail).toBe(false);
  });
});

describe("setActiveTab", () => {
  it("updates activeTab to feed", () => {
    getState().setActiveTab("feed");
    expect(getState().activeTab).toBe("feed");
  });

  it("updates activeTab to history", () => {
    getState().setActiveTab("history");
    expect(getState().activeTab).toBe("history");
  });

  it("updates activeTab to collection", () => {
    getState().setActiveTab("collection");
    expect(getState().activeTab).toBe("collection");
  });
});

describe("toggleTheme", () => {
  it("toggles dark -> light", () => {
    expect(getState().theme).toBe("dark");
    getState().toggleTheme();
    expect(getState().theme).toBe("light");
  });

  it("toggles light -> dark", () => {
    useStore.setState({ theme: "light" });
    getState().toggleTheme();
    expect(getState().theme).toBe("dark");
  });

  it("double toggle returns to original", () => {
    getState().toggleTheme();
    getState().toggleTheme();
    expect(getState().theme).toBe("dark");
  });
});

describe("setSelectedImage", () => {
  const img: Image = {
    id: "1",
    userId: "u1",
    prompt: "test",
    negativePrompt: null,
    color: null,
    resolution: "1024x1024",
    guidance: 5,
    imageUrl: "http://example.com/img.png",
    seed: 123,
    createdAt: "2024-01-01",
  };

  it("sets an image", () => {
    getState().setSelectedImage(img);
    expect(getState().selectedImage).toEqual(img);
  });

  it("clears the image when set to null", () => {
    getState().setSelectedImage(img);
    getState().setSelectedImage(null);
    expect(getState().selectedImage).toBeNull();
  });
});

describe("setShowSignInModal", () => {
  it("sets to true", () => {
    getState().setShowSignInModal(true);
    expect(getState().showSignInModal).toBe(true);
  });

  it("sets to false", () => {
    getState().setShowSignInModal(true);
    getState().setShowSignInModal(false);
    expect(getState().showSignInModal).toBe(false);
  });
});

describe("setShowImageDetail", () => {
  it("sets to true", () => {
    getState().setShowImageDetail(true);
    expect(getState().showImageDetail).toBe(true);
  });

  it("sets to false", () => {
    getState().setShowImageDetail(true);
    getState().setShowImageDetail(false);
    expect(getState().showImageDetail).toBe(false);
  });
});
