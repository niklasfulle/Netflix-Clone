import { act, renderHook } from "@testing-library/react";
import { useUploadTitleNotification } from "../useUploadTitleNotification";

const originalTitle = document.title;
const originalVisibility = Object.getOwnPropertyDescriptor(document, "visibilityState");

beforeEach(() => {
  document.title = "Netflix Admin - Neuer Inhalt";
});

it('announces completion without a separator when the page title is empty', () => {
  document.title = '';
  const { result } = renderHook(() => useUploadTitleNotification());
  act(() => { result.current.notify('Upload complete'); });
  expect(document.title).toBe('✓ Upload complete');
  act(() => { result.current.reset(); });
  expect(document.title).toBe('');
});

afterEach(() => {
  document.title = originalTitle;
  if (originalVisibility) Object.defineProperty(document, "visibilityState", originalVisibility);
  else Reflect.deleteProperty(document, "visibilityState");
});

it("preserves the page title without stacking repeated completion notices", () => {
  const { result } = renderHook(() => useUploadTitleNotification());
  act(() => { result.current.notify("Upload abgeschlossen"); });
  expect(document.title).toBe("✓ Upload abgeschlossen – Netflix Admin - Neuer Inhalt");
  act(() => { result.current.notify("Upload abgeschlossen"); });
  expect(document.title).toBe("✓ Upload abgeschlossen – Netflix Admin - Neuer Inhalt");
  act(() => { result.current.reset(); });
  expect(document.title).toBe("Netflix Admin - Neuer Inhalt");
});

it("keeps the notice in the background and restores the title when the tab becomes visible", () => {
  const { result } = renderHook(() => useUploadTitleNotification());
  act(() => { result.current.notify("Upload abgeschlossen"); });
  Object.defineProperty(document, "visibilityState", { configurable: true, value: "hidden" });
  act(() => { document.dispatchEvent(new Event("visibilitychange")); });
  expect(document.title).toContain("✓ Upload abgeschlossen");

  Object.defineProperty(document, "visibilityState", { value: "visible" });
  act(() => { document.dispatchEvent(new Event("visibilitychange")); });
  expect(document.title).toBe("Netflix Admin - Neuer Inhalt");
});

it("restores the title on window focus", () => {
  const { result } = renderHook(() => useUploadTitleNotification());
  act(() => { result.current.notify("Upload abgeschlossen"); });
  act(() => { window.dispatchEvent(new Event("focus")); });
  expect(document.title).toBe("Netflix Admin - Neuer Inhalt");
});

it("does not overwrite a new page title while clearing an old notice", () => {
  const { result, unmount } = renderHook(() => useUploadTitleNotification());
  act(() => { result.current.notify("Upload abgeschlossen"); });
  document.title = "Netflix - Andere Seite";
  unmount();
  expect(document.title).toBe("Netflix - Andere Seite");
});

it("restores the title on unmount and ignores late upload completions", () => {
  const { result, unmount } = renderHook(() => useUploadTitleNotification());
  const notify = result.current.notify;
  act(() => { notify("Upload abgeschlossen"); });
  unmount();
  expect(document.title).toBe("Netflix Admin - Neuer Inhalt");
  document.title = "Netflix - Andere Seite";
  act(() => { notify("Upload abgeschlossen"); });
  expect(document.title).toBe("Netflix - Andere Seite");
});
