import { redirect } from "next/navigation";

import Add from "@/app/(protected)/add/page";

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

it("redirects the legacy add route into the admin content workflow", () => {
  Add();

  expect(redirect).toHaveBeenCalledWith("/admin/movies/new");
});
