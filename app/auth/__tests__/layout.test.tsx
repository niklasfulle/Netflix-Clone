import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("AuthLayout", () => {
  const source = readFileSync(join(__dirname, "..", "layout.tsx"), "utf8");

  it("renders the logo at its intrinsic aspect ratio", () => {
    expect(source).toContain('className="h-12 w-auto"');
    expect(source).toContain("width={256}");
    expect(source).toContain("height={78}");
  });

  it("prioritizes the above-the-fold logo", () => {
    expect(source).toMatch(/<Image[\s\S]*?priority[\s\S]*?\/>/);
  });
});
