"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/store/useStore";
import Sidebar from "@/components/Sidebar/Sidebar";
import GeneratePage from "@/components/GeneratePage/GeneratePage";
import FeedPage from "@/components/FeedPage/FeedPage";
import GenerationHistoryPage from "@/components/GenerationHistoryPage/GenerationHistoryPage";
import MyCollectionPage from "@/components/MyCollectionPage/MyCollectionPage";
import ImageDetailModal from "@/components/ImageDetailModal/ImageDetailModal";
import SignInModal from "@/components/SignInModal/SignInModal";
import type { Image as ImageType } from "@/types";
import "./page.css";

export default function Home() {
  const { activeTab, theme, setActiveTab, showSignInModal, showImageDetail, selectedImage } =
    useStore();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [prefillSettings, setPrefillSettings] = useState<Partial<ImageType> | null>(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  function handleGenerateWithSettings(image: ImageType) {
    setPrefillSettings(image);
    setActiveTab("generate");
  }

  return (
    <div className="app">
      {/* Mobile header */}
      <header className="mobile-header">
        <button
          className="mobile-header__menu-btn"
          onClick={() => setMobileNavOpen(true)}
          aria-label="Open menu"
        >
          <img src="/resources/bars.svg" alt="" width={22} height={22} />
        </button>
        <img src="/resources/Logo.svg" alt="Logo" width={28} height={28} />
      </header>

      <Sidebar
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
      />

      <main className="main-content">
        {activeTab === "generate" && (
          <GeneratePage
            prefillSettings={prefillSettings}
            onClearPrefill={() => setPrefillSettings(null)}
          />
        )}
        {activeTab === "feed" && <FeedPage />}
        {activeTab === "history" && <GenerationHistoryPage />}
        {activeTab === "collection" && <MyCollectionPage />}
      </main>

      {showImageDetail && selectedImage && (
        <ImageDetailModal
          image={selectedImage}
          onGenerateWithSettings={handleGenerateWithSettings}
        />
      )}

      {showSignInModal && <SignInModal />}
    </div>
  );
}
