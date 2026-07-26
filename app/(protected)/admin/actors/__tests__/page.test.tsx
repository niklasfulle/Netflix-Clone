import { fireEvent, render, screen } from "@testing-library/react";
import useSWR from "swr";
import AdminActorsPage from "../page";

jest.mock("swr");
jest.mock("next/image", () => (props: any) => <img {...props} alt={props.alt || ""} />);

const actor = { id: "a1", name: "Ada Actor", movieCount: 2, seriesCount: 1, views: 33, content: [] };

beforeEach(() => {
  (useSWR as jest.Mock).mockReturnValue({ data: { actors: [actor], total: 1, totalPages: 1 }, error: undefined, isLoading: false, mutate: jest.fn() });
});

it("renders actor metrics and detail drawer", () => {
  render(<AdminActorsPage />);
  expect(screen.getByText("Ada Actor")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /Ada Actor anzeigen/i }));
  expect(screen.getByRole("dialog", { name: /Details zu Ada Actor/i })).toBeInTheDocument();
});

it("opens the create dialog", () => {
  render(<AdminActorsPage />);
  fireEvent.click(screen.getByRole("button", { name: /Darsteller hinzufügen/i }));
  expect(screen.getByRole("dialog", { name: "Darsteller hinzufügen" })).toBeInTheDocument();
});
