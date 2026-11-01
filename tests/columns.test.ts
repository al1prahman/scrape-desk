import { describe, expect, it } from "vitest";
import { getColumns } from "../lib/scrape/columns";

describe("getColumns", () => {
  it("config css balik nama field", () => {
    const columns = getColumns({
      mode: "css",
      fields: [
        { name: "title", selector: "h3 a" },
        { name: "price", selector: ".price" },
      ],
    });
    expect(columns).toEqual(["title", "price"]);
  });

  it("config ai balik nama schema", () => {
    const columns = getColumns({
      mode: "ai",
      instruction: "ambil",
      schema: [
        { name: "title", description: "judul" },
        { name: "price", description: "harga" },
      ],
    });
    expect(columns).toEqual(["title", "price"]);
  });

  it("config legacy tanpa mode nggak crash, ini bug yang diperbaiki", () => {
    const columns = getColumns({
      fields: [
        { name: "title", selector: "h3 a" },
        { name: "price", selector: ".price" },
        { name: "stock", selector: ".stock" },
      ],
    } as never);
    expect(columns).toEqual(["title", "price", "stock"]);
  });

  it("config kosong balik array kosong", () => {
    expect(getColumns({} as never)).toEqual([]);
    expect(getColumns(null as never)).toEqual([]);
  });

  it("feed config dengan fields kosong balik array kosong", () => {
    const columns = getColumns({ mode: "css", fields: [], sourceType: "feed" });
    expect(columns).toEqual([]);
  });
});
