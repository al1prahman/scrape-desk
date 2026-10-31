export type ExtractField = {
  name: string;
  selector: string;
};

export type AiField = {
  name: string;
  description: string;
};

export type CssExtractConfig = {
  mode: "css";
  fields: ExtractField[];
  limit?: number;
};

export type AiExtractConfig = {
  mode: "ai";
  instruction: string;
  schema: AiField[];
  limit?: number;
};

export type ExtractConfig = CssExtractConfig | AiExtractConfig;

export type ScrapedRow = Record<string, string>;
