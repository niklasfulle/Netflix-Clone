import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { settings } from "@/actions/settings";
import { LanguageProvider } from "@/components/providers/LanguageProvider";

import { SettingsForm } from "../settings-form";

const mockUpdateSession = jest.fn();
const mockSuccessToast = jest.fn();
const mockErrorToast = jest.fn();

jest.mock("next-auth/react", () => ({
  useSession: () => ({ update: mockUpdateSession }),
}));

jest.mock("@/actions/settings", () => ({
  settings: jest.fn(),
}));

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: {
    success: (...args: unknown[]) => mockSuccessToast(...args),
    error: (...args: unknown[]) => mockErrorToast(...args),
  },
}));

jest.mock("@/components/LanguageSwitcher", () => ({
  __esModule: true,
  default: () => <div data-testid="language-switcher">DE / EN</div>,
}));

const mockSettings = settings as jest.MockedFunction<typeof settings>;

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

const passwordAccount = {
  data: {
    user: {
      name: "Jane Doe",
      email: "jane@example.com",
      role: "USER" as const,
      isOAuth: false,
      isTwoFactorEnabled: false,
    },
  },
};

describe("SettingsForm", () => {
  beforeAll(() => {
    global.ResizeObserver = ResizeObserverMock;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockSettings.mockResolvedValue({ success: "Settings updated!" });
    mockUpdateSession.mockResolvedValue(undefined);
  });

  it("renders account, security, and language controls", () => {
    render(<SettingsForm user={passwordAccount} />);

    expect(
      screen.getByRole("heading", { name: "Personal information" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Sign-in & security" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Language & display" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toHaveValue("Jane Doe");
    expect(screen.getByLabelText("Email")).toHaveValue("jane@example.com");
    expect(screen.getByTestId("language-switcher")).toBeInTheDocument();
    expect(screen.getByText("Member")).toBeInTheDocument();
  });

  it("renders account controls in German at render time", () => {
    render(
      <LanguageProvider initialLocale="de">
        <SettingsForm user={passwordAccount} />
      </LanguageProvider>,
    );

    expect(screen.getByRole("heading", { name: "Persönliche Daten" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Anmeldung & Sicherheit" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Änderungen speichern" })).toBeInTheDocument();
  });

  it("allows personal information to be edited and saved", async () => {
    render(<SettingsForm user={passwordAccount} />);

    const saveButton = screen.getByRole("button", { name: "Save changes" });
    expect(saveButton).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Jane Updated" },
    });
    expect(saveButton).toBeEnabled();
    expect(screen.getByText("You have unsaved changes.")).toBeInTheDocument();

    fireEvent.click(saveButton);

    await waitFor(() =>
      expect(mockSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Jane Updated",
          email: "jane@example.com",
          role: "USER",
        }),
      ),
    );
    await waitFor(() => expect(mockUpdateSession).toHaveBeenCalled());
    expect(mockSuccessToast).toHaveBeenCalledWith("Settings updated!");
  });

  it("can reveal and hide both password inputs", () => {
    render(<SettingsForm user={passwordAccount} />);

    const currentPassword = screen.getByLabelText("Current password");
    const newPassword = screen.getByLabelText("New password");

    expect(currentPassword).toHaveAttribute("type", "password");
    fireEvent.click(
      screen.getByRole("button", { name: "Show current password" }),
    );
    expect(currentPassword).toHaveAttribute("type", "text");
    expect(
      screen.getByRole("button", { name: "Hide current password" }),
    ).toBeInTheDocument();

    expect(newPassword).toHaveAttribute("type", "password");
    fireEvent.click(screen.getByRole("button", { name: "Show new password" }));
    expect(newPassword).toHaveAttribute("type", "text");
  });

  it("requires the current password when a new password is entered", async () => {
    render(<SettingsForm user={passwordAccount} />);

    fireEvent.change(screen.getByLabelText("New password"), {
      target: { value: "New-password-123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(
      await screen.findByText("Current password is required!"),
    ).toBeInTheDocument();
    expect(mockSettings).not.toHaveBeenCalled();
  });

  it("shows provider-managed security for OAuth accounts", () => {
    render(
      <SettingsForm
        user={{
          data: {
            user: {
              ...passwordAccount.data.user,
              isOAuth: true,
            },
          },
        }}
      />,
    );

    expect(screen.getByLabelText("Email")).toHaveAttribute("readonly");
    expect(screen.getByText("Connected account")).toBeInTheDocument();
    expect(screen.getByText("Security managed externally")).toBeInTheDocument();
    expect(screen.queryByLabelText("Current password")).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText("Two-factor authentication"),
    ).not.toBeInTheDocument();
  });

  it("surfaces server errors without refreshing the session", async () => {
    mockSettings.mockResolvedValue({ error: "Incorrect password!" });
    render(<SettingsForm user={passwordAccount} />);

    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Changed name" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() =>
      expect(mockErrorToast).toHaveBeenCalledWith("Incorrect password!"),
    );
    expect(mockUpdateSession).not.toHaveBeenCalled();
  });
});
