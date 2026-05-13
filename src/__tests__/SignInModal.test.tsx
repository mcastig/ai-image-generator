import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

const mockSignIn = jest.fn();
jest.mock("next-auth/react", () => ({ signIn: mockSignIn }));
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} />,
}));

import SignInModal from "@/components/SignInModal/SignInModal";
import { useStore } from "@/store/useStore";

beforeEach(() => {
  useStore.setState({ showSignInModal: true, setShowSignInModal: useStore.getState().setShowSignInModal });
  mockSignIn.mockReset();
});

describe("SignInModal", () => {
  it("renders the sign-in title", () => {
    render(<SignInModal />);
    expect(screen.getByText("Sign In to Continue")).toBeInTheDocument();
  });

  it("renders GitHub sign-in button", () => {
    render(<SignInModal />);
    expect(screen.getByText("Sign in with Github")).toBeInTheDocument();
  });

  it("calls signIn('github') when GitHub button is clicked", () => {
    render(<SignInModal />);
    fireEvent.click(screen.getByText("Sign in with Github"));
    expect(mockSignIn).toHaveBeenCalledWith("github");
  });

  it("closes modal when overlay is clicked", () => {
    render(<SignInModal />);
    const overlay = document.querySelector(".signin-overlay") as HTMLElement;
    fireEvent.click(overlay);
    expect(useStore.getState().showSignInModal).toBe(false);
  });

  it("closes modal when close button is clicked", () => {
    render(<SignInModal />);
    const closeBtn = document.querySelector(".signin-modal__close") as HTMLElement;
    fireEvent.click(closeBtn);
    expect(useStore.getState().showSignInModal).toBe(false);
  });

  it("does not close when clicking the modal itself", () => {
    render(<SignInModal />);
    const modal = document.querySelector(".signin-modal") as HTMLElement;
    fireEvent.click(modal);
    expect(useStore.getState().showSignInModal).toBe(true);
  });
});
