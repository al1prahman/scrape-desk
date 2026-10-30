export type ExtractField = {
  name: string;
  selector: string;
};

export type ExtractConfig = {
  fields: ExtractField[];
  limit?: number;
};

export type ScrapedRow = Record<string, string>;
