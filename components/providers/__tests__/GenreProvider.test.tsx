import { render, screen } from "@testing-library/react";

import {
  GenreProvider,
  useGenreOptions,
} from "@/components/providers/GenreProvider";

function GenreConsumer() {
  const genres = useGenreOptions();
  return <span>{genres.join("|")}</span>;
}

describe("GenreProvider", () => {
  it("provides the configured genre list", () => {
    render(
      <GenreProvider genres={["Action", "Drama"]}>
        <GenreConsumer />
      </GenreProvider>,
    );

    expect(screen.getByText("Action|Drama")).toBeInTheDocument();
  });

  it("defaults to an empty list outside the provider", () => {
    render(<GenreConsumer />);

    expect(screen.getByText("", { selector: "span" })).toBeInTheDocument();
  });
});
