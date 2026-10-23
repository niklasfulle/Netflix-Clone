import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

import {
  getQrApprovalPath,
  QrDeviceScanner,
} from "../qr-device-scanner";

const mockPush = jest.fn();
const mockStop = jest.fn();
const mockDecodeFromConstraints = jest.fn();

let decodeCallback:
  | ((
      result: { getText: () => string } | undefined,
      error: unknown,
      controls: { stop: () => void },
    ) => void)
  | undefined;

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("@zxing/browser", () => ({
  BrowserQRCodeReader: jest.fn().mockImplementation(() => ({
    decodeFromConstraints: mockDecodeFromConstraints,
  })),
}));

describe("QrDeviceScanner", () => {
  it.each(['https://[', '/auth/qr/approve?pair=', '/auth/qr/approve?pair=short', '/auth/qr/approve?other=value'])('rejects malformed approval data: %s', value => {
    expect(getQrApprovalPath(value, 'https://netflix.test')).toBeNull();
  });

  it('shows camera permission failures and leaves manual approval available', async () => {
    mockDecodeFromConstraints.mockRejectedValueOnce(new Error('Permission denied'));
    render(<QrDeviceScanner />);
    fireEvent.click(screen.getByRole('button', { name: 'Scan QR code' }));
    expect(await screen.findByText('Camera access failed. Allow camera access or enter the code manually.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Enter a code manually' })).toHaveAttribute('href', '/auth/qr/approve');
  });

  it('stops late camera initialization after closing and ignores stale detections', async () => {
    let initialize!: (controls: { stop: () => void }) => void;
    mockDecodeFromConstraints.mockImplementationOnce((_constraints, _video, callback) => {
      decodeCallback = callback;
      return new Promise(resolve => { initialize = resolve; });
    });
    render(<QrDeviceScanner />);
    fireEvent.click(screen.getByRole('button', { name: 'Scan QR code' }));
    await waitFor(() => expect(initialize).toBeDefined());
    fireEvent.click(screen.getByRole('button', { name: 'Close scanner' }));
    await act(async () => { initialize({ stop: mockStop }); });
    expect(mockStop).toHaveBeenCalled();
    act(() => { decodeCallback?.(undefined, undefined, { stop: mockStop }); });
    expect(mockPush).not.toHaveBeenCalled();
  });
  beforeEach(() => {
    jest.clearAllMocks();
    decodeCallback = undefined;
    mockDecodeFromConstraints.mockImplementation(
      async (_constraints, _video, callback) => {
        decodeCallback = callback;
        return { stop: mockStop };
      },
    );
  });

  it("accepts only same-origin QR approval links with a valid pairing secret", () => {
    const pairSecret = "a-valid_pairing-secret-with-more-than-32-characters";

    expect(
      getQrApprovalPath(
        `https://netflix.test/auth/qr/approve?pair=${pairSecret}`,
        "https://netflix.test",
      ),
    ).toBe(`/auth/qr/approve?pair=${pairSecret}`);
    expect(
      getQrApprovalPath(
        `https://attacker.test/auth/qr/approve?pair=${pairSecret}`,
        "https://netflix.test",
      ),
    ).toBeNull();
    expect(
      getQrApprovalPath(
        `https://netflix.test/auth/qr/approve?pair=${pairSecret}&next=/`,
        "https://netflix.test",
      ),
    ).toBeNull();
  });

  it("opens the camera and routes a valid scan to the approval flow", async () => {
    render(<QrDeviceScanner />);

    fireEvent.click(screen.getByRole("button", { name: "Scan QR code" }));
    await waitFor(() => expect(mockDecodeFromConstraints).toHaveBeenCalled());

    const pairSecret = "a-valid_pairing-secret-with-more-than-32-characters";
    act(() => {
      decodeCallback?.(
        {
          getText: () =>
            `${window.location.origin}/auth/qr/approve?pair=${pairSecret}`,
        },
        undefined,
        { stop: mockStop },
      );
    });

    expect(mockStop).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith(
      `/auth/qr/approve?pair=${pairSecret}`,
    );
  });

  it("keeps scanning after an unrelated QR code and stops on close", async () => {
    render(<QrDeviceScanner />);

    fireEvent.click(screen.getByRole("button", { name: "Scan QR code" }));
    await waitFor(() => expect(mockDecodeFromConstraints).toHaveBeenCalled());

    act(() => {
      decodeCallback?.(
        { getText: () => "https://example.com" },
        undefined,
        { stop: mockStop },
      );
    });

    expect(
      screen.getByText(/This is not a valid sign-in QR code/),
    ).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Close scanner" }));
    expect(mockStop).toHaveBeenCalled();
    expect(
      screen.queryByLabelText("Camera preview for QR code scanning"),
    ).not.toBeInTheDocument();
  });
});
