import { redirect } from "next/navigation";

import LegacyEditMoviePage from "../page";

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

it("redirects the legacy edit URL into the admin area", async () => {
  await LegacyEditMoviePage({
    params: Promise.resolve({ movieId: "movie-1" }),
  });

  expect(redirect).toHaveBeenCalledWith("/admin/movies/movie-1/edit");
});
