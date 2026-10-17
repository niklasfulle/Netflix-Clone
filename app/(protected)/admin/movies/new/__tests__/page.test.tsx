import { fireEvent, render, screen } from "@testing-library/react";
import { LanguageProvider, useLanguage } from "@/components/providers/LanguageProvider";

import AdminCreateMoviePage, { metadata } from "../page";

jest.mock("next/link", () => ({ children, href, ...props }: any) => (
  <a href={href} {...props}>{children}</a>
));

jest.mock("@/app/(protected)/add/_components/add-movie-form", () => ({
    AddMovieForm: () => <form aria-label="Add Movie" />,
}));

describe("Admin create content page", () => {
  it("translates the workflow and responds to language changes", () => {
    function LanguageToggle() {
      const { setLocale } = useLanguage();
      return <button onClick={() => setLocale("en")}>English</button>;
    }
    render(
      <LanguageProvider initialLocale="de">
        <AdminCreateMoviePage />
        <LanguageToggle />
      </LanguageProvider>,
    );

    expect(screen.getByRole("heading", { name: "Neuen Inhalt hinzufügen" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Zur Inhaltsverwaltung" })).toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: "Hinweise zum Anlegen" })).toBeInTheDocument();
    expect(screen.getByText("Vier Schritte bis zum neuen Inhalt")).toBeInTheDocument();
    expect(screen.getByText("Bestehende Darsteller zuordnen oder fehlende Einträge direkt im Formular anlegen.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Vor dem Speichern" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "English" }));
    expect(screen.getByRole("heading", { name: "Add New Content" })).toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: "Creation Guidance" })).toBeInTheDocument();
  });

  it("renders the movie form inside the admin workflow", () => {
    render(<AdminCreateMoviePage />);

    expect(screen.getByRole("heading", { name: "Add New Content" })).toBeInTheDocument();
    expect(screen.getByRole("form", { name: "Add Movie" })).toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: "Creation Guidance" })).toBeInTheDocument();
  });

  it("links back to content management", () => {
    render(<AdminCreateMoviePage />);

    expect(screen.getByRole("link", { name: /Back to Content Management/i })).toHaveAttribute(
      "href",
      "/admin/movies",
    );
  });

  it("exposes specific admin metadata", () => {
    expect(metadata.title).toBe("Netflix Admin - Neuer Inhalt");
    expect(metadata.description).toMatch(/Film oder eine neue Serie/i);
  });
});
