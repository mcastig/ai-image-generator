import { create } from "zustand";
import type { Image, TabId } from "@/types";

interface AppState {
  activeTab: TabId;
  theme: "dark" | "light";
  selectedImage: Image | null;
  showSignInModal: boolean;
  showImageDetail: boolean;

  setActiveTab: (tab: TabId) => void;
  toggleTheme: () => void;
  setSelectedImage: (image: Image | null) => void;
  setShowSignInModal: (show: boolean) => void;
  setShowImageDetail: (show: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
  activeTab: "generate",
  theme: "dark",
  selectedImage: null,
  showSignInModal: false,
  showImageDetail: false,

  setActiveTab: (tab) => set({ activeTab: tab }),
  toggleTheme: () =>
    set((state) => ({ theme: state.theme === "dark" ? "light" : "dark" })),
  setSelectedImage: (image) => set({ selectedImage: image }),
  setShowSignInModal: (show) => set({ showSignInModal: show }),
  setShowImageDetail: (show) => set({ showImageDetail: show }),
}));
