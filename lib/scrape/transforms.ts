import type { ScrapedRow, Transform } from "./types";

// Apply transform ke satu nilai field. Regex yang nggak match balik
// string kosong, jadi kolom target konsisten tipe-nya.
function applyToOne(value: string, transform: Transform, row: ScrapedRow): string {
  switch (transform.type) {
    case "regex": {
      const match = value.match(new RegExp(transform.pattern));
      if (!match) return "";
      return match[transform.group ?? 1] ?? "";
    }
    case "replace":
      return value.split(transform.from).join(transform.to);
    case "number": {
      // Handle format Indonesia (1.234,56) dan English (1,234.56):
      // separator paling kanan dianggap desimal, yang lain dibuang.
      const match = value.match(/-?[\d.,]+/);
      if (!match) return "";
      let num = match[0];
      const lastComma = num.lastIndexOf(",");
      const lastDot = num.lastIndexOf(".");

      if (lastComma > -1 && lastDot > -1) {
        num =
          lastComma > lastDot
            ? num.split(".").join("").replace(",", ".")
            : num.split(",").join("");
      } else if (lastComma > -1) {
        const decimals = num.length - lastComma - 1;
        num = decimals === 3 ? num.split(",").join("") : num.replace(",", ".");
      }

      return num;
    }
    case "prefix":
      return `${transform.value}${value}`;
    case "suffix":
      return `${value}${transform.value}`;
    case "lowercase":
      return value.toLowerCase();
    case "uppercase":
      return value.toUpperCase();
    case "template":
      return transform.template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => row[key] ?? "");
  }
}

// Transform dijalanin berurutan. Tanpa target, hasil nimpa field asal.
// Dengan target, hasil masuk ke kolom baru dan asal tetap ada.
export function applyTransforms(rows: ScrapedRow[], transforms: Transform[]): ScrapedRow[] {
  if (transforms.length === 0) return rows;

  return rows.map((row) => {
    const result: ScrapedRow = { ...row };

    for (const transform of transforms) {
      if (transform.type === "template") {
        result[transform.target] = applyToOne("", transform, result);
        continue;
      }

      const source = result[transform.field];
      if (source === undefined) continue;

      const transformed = applyToOne(source, transform, result);
      const target = "target" in transform && transform.target ? transform.target : transform.field;
      result[target] = transformed;
    }

    return result;
  });
}
