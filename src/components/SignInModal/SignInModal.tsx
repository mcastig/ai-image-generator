"use client";

import Image from "next/image";
import { signIn } from "next-auth/react";
import { useStore } from "@/store/useStore";
import "./SignInModal.css";

export default function SignInModal() {
  const { setShowSignInModal } = useStore();

  return (
    <div className="signin-overlay" onClick={() => setShowSignInModal(false)}>
      <div className="signin-modal" onClick={(e) => e.stopPropagation()}>
        <button className="signin-modal__close" onClick={() => setShowSignInModal(false)}>
          <Image src="/resources/Close.svg" alt="Close" width={16} height={16} />
        </button>
        <h2 className="signin-modal__title">Sign In to Continue</h2>
        <button
          className="signin-modal__github-btn"
          onClick={() => signIn("github")}
        >
          <Image src="/resources/github.svg" alt="GitHub" width={20} height={20} />
          Sign in with Github
        </button>
      </div>
    </div>
  );
}
