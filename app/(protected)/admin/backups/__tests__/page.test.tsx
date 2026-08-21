import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import AdminBackupsPage from "../page";

jest.mock("@/components/admin/BackupVerificationPanel", () => ({
  BackupVerificationPanel: () => <div>PostgreSQL verification panel</div>,
}));

describe("admin backups page", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    globalThis.fetch = jest.fn();
    globalThis.confirm = jest.fn(() => true);
    URL.createObjectURL = jest.fn(() => "blob:backup");
    URL.revokeObjectURL = jest.fn();
    jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
  });

  it("renders create, restore, and scope information", () => {
    render(<AdminBackupsPage />);

    expect(screen.getByRole("heading", { name: "Database Backups" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Create Backup" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Restore Backup" })).toBeInTheDocument();
    expect(screen.getByText("Not Included")).toBeInTheDocument();
  });

  it("validates the create password before requesting an archive", () => {
    render(<AdminBackupsPage />);

    fireEvent.change(screen.getByPlaceholderText("At least 12 characters"), {
      target: { value: "short" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create and Download Backup" }));

    expect(screen.getByRole("alert")).toHaveTextContent("at least 12 characters");
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("downloads an encrypted backup", async () => {
    const response = {
      ok: true,
      blob: jest.fn().mockResolvedValue(new Blob([new Uint8Array([1, 2, 3])])),
      headers: new Headers({
        "Content-Disposition": 'attachment; filename="netflix-backup.nfbak"',
        "X-Backup-Records": "42",
      }),
    };
    (globalThis.fetch as jest.Mock).mockResolvedValue(response);
    render(<AdminBackupsPage />);

    fireEvent.change(screen.getByPlaceholderText("At least 12 characters"), {
      target: { value: "secure-backup-password" },
    });
    fireEvent.change(screen.getByPlaceholderText("Repeat backup password"), {
      target: { value: "secure-backup-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create and Download Backup" }));

    expect(await screen.findByRole("status")).toHaveTextContent("42 database records");
    expect(globalThis.fetch).toHaveBeenCalledWith("/api/admin/backups", expect.objectContaining({
      method: "POST",
    }));
  });

  it("restores only after file, password, phrase, checkbox, and dialog confirmation", async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ success: true, records: 17 }),
    });
    render(<AdminBackupsPage />);

    const file = new File([new Uint8Array([1, 2, 3])], "backup.nfbak");
    fireEvent.change(screen.getByLabelText("Backup File"), { target: { files: [file] } });
    fireEvent.change(screen.getByPlaceholderText("Password used when creating the backup"), {
      target: { value: "secure-backup-password" },
    });
    fireEvent.change(screen.getByPlaceholderText("RESTORE"), { target: { value: "RESTORE" } });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Restore Database Backup" }));

    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/admin/backups",
      expect.objectContaining({ method: "PUT", body: expect.any(FormData) }),
    ));
    expect(globalThis.confirm).toHaveBeenCalled();
    expect(await screen.findByRole("status")).toHaveTextContent("17 database records");
  });
});
