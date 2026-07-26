import { render, screen, waitFor } from "@testing-library/react";

import useCurrentProfil from "@/hooks/useCurrentProfil";
import getUser from "@/hooks/useUser";

import SettingsPage from "../page";

const mockReplace = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

jest.mock("@/hooks/useUser", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@/hooks/useCurrentProfil", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@/components/Navbar", () => ({
  __esModule: true,
  default: () => <nav data-testid="navbar">Navbar</nav>,
}));

jest.mock("@/components/Footer", () => ({
  __esModule: true,
  default: () => <footer data-testid="footer">Footer</footer>,
}));

jest.mock("../_components/settings-form", () => ({
  SettingsForm: () => <div data-testid="settings-form">Settings form</div>,
}));

const mockGetUser = getUser as jest.MockedFunction<typeof getUser>;
const mockUseCurrentProfile = useCurrentProfil as jest.MockedFunction<
  typeof useCurrentProfil
>;

describe("SettingsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockReturnValue({
      data: {
        user: {
          name: "Jane Doe",
          email: "jane@example.com",
          isTwoFactorEnabled: true,
        },
      },
      error: undefined,
      isLoading: false,
    });
    mockUseCurrentProfile.mockReturnValue({
      data: {
        id: "profile-1",
        profilName: "Jane",
      },
      error: undefined,
      isLoading: false,
      mutate: jest.fn(),
    });
  });

  it("renders the complete settings shell and account summary", () => {
    render(<SettingsPage />);

    expect(screen.getByTestId("navbar")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Your account, your preferences.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to Netflix" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(
      screen.getByRole("navigation", { name: "Settings sections" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("Signed in with profile Jane.")).toBeInTheDocument();
    expect(screen.getByTestId("settings-form")).toBeInTheDocument();
    expect(screen.getByTestId("footer")).toBeInTheDocument();
  });

  it("shows a responsive skeleton while account data is loading", () => {
    mockGetUser.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true,
    });

    const { container } = render(<SettingsPage />);

    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
    expect(screen.queryByTestId("settings-form")).not.toBeInTheDocument();
  });

  it("redirects to profile selection when no active profile exists", async () => {
    mockUseCurrentProfile.mockReturnValue({
      data: null,
      error: new Error("No active profile"),
      isLoading: false,
      mutate: jest.fn(),
    });

    render(<SettingsPage />);

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/profiles"));
    expect(screen.queryByTestId("settings-form")).not.toBeInTheDocument();
  });
});
