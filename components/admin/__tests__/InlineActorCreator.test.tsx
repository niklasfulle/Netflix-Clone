import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { InlineActorCreator } from "../InlineActorCreator";

describe("InlineActorCreator", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it("creates an actor and returns it to the movie form", async () => {
    const onActorCreated = jest.fn();
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ id: "actor-3", name: "Ada Lovelace" }),
    });

    render(<InlineActorCreator onActorCreated={onActorCreated} />);

    fireEvent.click(screen.getByRole("button", { name: "Neuen Darsteller anlegen" }));
    fireEvent.change(screen.getByLabelText("Name des Darstellers"), {
      target: { value: "  Ada Lovelace  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Darsteller anlegen" }));

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith("/api/actors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Ada Lovelace" }),
      });
      expect(onActorCreated).toHaveBeenCalledWith({
        id: "actor-3",
        name: "Ada Lovelace",
      });
    });

    expect(screen.queryByLabelText("Name des Darstellers")).not.toBeInTheDocument();
  });

  it("keeps the input open and displays API errors", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: jest.fn().mockResolvedValue({
        error: "Dieser Darsteller existiert bereits.",
      }),
    });

    render(<InlineActorCreator onActorCreated={jest.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Neuen Darsteller anlegen" }));
    fireEvent.change(screen.getByLabelText("Name des Darstellers"), {
      target: { value: "Ada Lovelace" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Darsteller anlegen" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Dieser Darsteller existiert bereits.",
    );
    expect(screen.getByLabelText("Name des Darstellers")).toHaveValue("Ada Lovelace");
  });

  it("does not allow empty actor names", () => {
    render(<InlineActorCreator onActorCreated={jest.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Neuen Darsteller anlegen" }));

    expect(screen.getByRole("button", { name: "Darsteller anlegen" })).toBeDisabled();
  });
});
