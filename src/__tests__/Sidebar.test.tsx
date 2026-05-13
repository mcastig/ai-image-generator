import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

const mockSignIn = jest.fn();
const mockSignOut = jest.fn();
const mockUseSession = jest.fn();

jest.mock("next-auth/react", () => ({
  signIn: mockSignIn,
  signOut: mockSignOut,
  useSession: mockUseSession,
}));
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} />,
}));

import Sidebar from "@/components/Sidebar/Sidebar";
import { useStore } from "@/store/useStore";

beforeEach(() => {
  useStore.setState({
    activeTab: "generate",
    theme: "dark",
    showSignInModal: false,
  });
  mockSignIn.mockReset();
  mockSignOut.mockReset();
  mockUseSession.mockReturnValue({ data: null });
});

describe("Sidebar — unauthenticated", () => {
  it("renders sign in button when not authenticated", () => {
    render(<Sidebar mobileOpen={false} onMobileClose={jest.fn()} />);
    expect(screen.getByText("Sign In")).toBeInTheDocument();
  });

  it("calls signIn('github') when sign-in button clicked", () => {
    render(<Sidebar mobileOpen={false} onMobileClose={jest.fn()} />);
    fireEvent.click(screen.getByText("Sign In"));
    expect(mockSignIn).toHaveBeenCalledWith("github");
  });

  it("renders all nav items", () => {
    render(<Sidebar mobileOpen={false} onMobileClose={jest.fn()} />);
    expect(screen.getByText("Generate Image")).toBeInTheDocument();
    expect(screen.getByText("Feed")).toBeInTheDocument();
    expect(screen.getByText("Generation History")).toBeInTheDocument();
    expect(screen.getByText("My Collection")).toBeInTheDocument();
  });

  it("switches to feed tab when Feed is clicked", () => {
    render(<Sidebar mobileOpen={false} onMobileClose={jest.fn()} />);
    fireEvent.click(screen.getByText("Feed"));
    expect(useStore.getState().activeTab).toBe("feed");
  });

  it("shows sign-in modal when unauthenticated user clicks History", () => {
    render(<Sidebar mobileOpen={false} onMobileClose={jest.fn()} />);
    fireEvent.click(screen.getByText("Generation History"));
    expect(useStore.getState().showSignInModal).toBe(true);
    expect(useStore.getState().activeTab).toBe("generate");
  });

  it("shows sign-in modal when unauthenticated user clicks Collection", () => {
    render(<Sidebar mobileOpen={false} onMobileClose={jest.fn()} />);
    fireEvent.click(screen.getByText("My Collection"));
    expect(useStore.getState().showSignInModal).toBe(true);
  });

  it("calls onMobileClose when a nav tab is selected", () => {
    const onClose = jest.fn();
    render(<Sidebar mobileOpen={false} onMobileClose={onClose} />);
    fireEvent.click(screen.getByText("Feed"));
    expect(onClose).toHaveBeenCalled();
  });

  it("renders overlay when mobileOpen is true", () => {
    render(<Sidebar mobileOpen={true} onMobileClose={jest.fn()} />);
    expect(document.querySelector(".sidebar-overlay")).toBeInTheDocument();
  });

  it("calls onMobileClose when overlay is clicked", () => {
    const onClose = jest.fn();
    render(<Sidebar mobileOpen={true} onMobileClose={onClose} />);
    fireEvent.click(document.querySelector(".sidebar-overlay") as HTMLElement);
    expect(onClose).toHaveBeenCalled();
  });

  it("sidebar has --open class when mobileOpen=true", () => {
    render(<Sidebar mobileOpen={true} onMobileClose={jest.fn()} />);
    expect(document.querySelector(".sidebar--open")).toBeInTheDocument();
  });

  it("shows theme toggle button", () => {
    render(<Sidebar mobileOpen={false} onMobileClose={jest.fn()} />);
    expect(screen.getByText("Light Mode")).toBeInTheDocument();
  });

  it("toggles theme when theme button clicked", () => {
    render(<Sidebar mobileOpen={false} onMobileClose={jest.fn()} />);
    fireEvent.click(screen.getByText("Light Mode"));
    expect(useStore.getState().theme).toBe("light");
    expect(screen.getByText("Dark Mode")).toBeInTheDocument();
  });
});

describe("Sidebar — authenticated", () => {
  const session = {
    user: {
      id: "u1",
      name: "Alice",
      email: "alice@example.com",
      avatarUrl: "https://avatars.githubusercontent.com/u/1",
    },
  };

  beforeEach(() => {
    mockUseSession.mockReturnValue({ data: session });
  });

  it("shows avatar button when authenticated", () => {
    render(<Sidebar mobileOpen={false} onMobileClose={jest.fn()} />);
    const avatarBtn = document.querySelector(".sidebar__avatar-btn");
    expect(avatarBtn).toBeInTheDocument();
  });

  it("shows user popover on avatar click", () => {
    render(<Sidebar mobileOpen={false} onMobileClose={jest.fn()} />);
    fireEvent.click(document.querySelector(".sidebar__avatar-btn") as HTMLElement);
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Sign out")).toBeInTheDocument();
  });

  it("calls signOut when Sign out is clicked", () => {
    render(<Sidebar mobileOpen={false} onMobileClose={jest.fn()} />);
    fireEvent.click(document.querySelector(".sidebar__avatar-btn") as HTMLElement);
    fireEvent.click(screen.getByText("Sign out"));
    expect(mockSignOut).toHaveBeenCalled();
  });

  it("closes popover when clicking outside", async () => {
    render(<Sidebar mobileOpen={false} onMobileClose={jest.fn()} />);
    fireEvent.click(document.querySelector(".sidebar__avatar-btn") as HTMLElement);
    expect(screen.getByText("Sign out")).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    await waitFor(() => {
      expect(screen.queryByText("Sign out")).not.toBeInTheDocument();
    });
  });

  it("shows avatar placeholder when no avatarUrl", () => {
    mockUseSession.mockReturnValue({
      data: { user: { ...session.user, avatarUrl: null } },
    });
    render(<Sidebar mobileOpen={false} onMobileClose={jest.fn()} />);
    const placeholder = document.querySelector(".sidebar__avatar-placeholder");
    expect(placeholder).toBeInTheDocument();
    expect(placeholder?.textContent).toBe("A");
  });

  it("shows 'U' placeholder when name is null", () => {
    mockUseSession.mockReturnValue({
      data: { user: { ...session.user, name: null, avatarUrl: null } },
    });
    render(<Sidebar mobileOpen={false} onMobileClose={jest.fn()} />);
    const placeholder = document.querySelector(".sidebar__avatar-placeholder");
    expect(placeholder?.textContent).toBe("U");
  });

  it("navigates to history tab when authenticated", () => {
    render(<Sidebar mobileOpen={false} onMobileClose={jest.fn()} />);
    fireEvent.click(screen.getByText("Generation History"));
    expect(useStore.getState().activeTab).toBe("history");
  });

  it("shows 'User' as alt text when name is null but avatar is set", () => {
    mockUseSession.mockReturnValue({
      data: { user: { ...session.user, name: null } },
    });
    render(<Sidebar mobileOpen={false} onMobileClose={jest.fn()} />);
    const avatarImg = document.querySelector(".sidebar__avatar-img") as HTMLImageElement;
    expect(avatarImg).toBeInTheDocument();
    expect(avatarImg.alt).toBe("User");
  });

  it("does not close popover when clicking inside the menu", async () => {
    render(<Sidebar mobileOpen={false} onMobileClose={jest.fn()} />);
    fireEvent.click(document.querySelector(".sidebar__avatar-btn") as HTMLElement);
    expect(screen.getByText("Sign out")).toBeInTheDocument();
    // Click inside popover - should not close
    fireEvent.mouseDown(document.querySelector(".sidebar__user-popover") as HTMLElement);
    expect(screen.queryByText("Sign out")).toBeInTheDocument();
  });

  it("navigates to collection tab when authenticated", () => {
    render(<Sidebar mobileOpen={false} onMobileClose={jest.fn()} />);
    fireEvent.click(screen.getByText("My Collection"));
    expect(useStore.getState().activeTab).toBe("collection");
  });
});
