import { promises as fs } from "fs";
import path from "path";
import Papa from "papaparse";

export interface SurveyParseResult {
  totalRows: number;
  headerRowIndex: number;
  headers: string[];
  data: Record<string, string>[];
}

export async function parseSurveyCSV(
  filename: string
): Promise<SurveyParseResult> {
  const filePath = path.join(
    process.cwd(),
    "src/app/api/survey/_data",
    filename
  );

  const fileContents = await fs.readFile(filePath, "utf8");

  // Parse with minimal options
  const results = Papa.parse<string[]>(fileContents, {
    header: false,
    skipEmptyLines: false,
    delimiter: ",",
    quoteChar: '"',
  });

  // Find header row (row with "First Name")
  const headerRowIndex = results.data.findIndex((row: string[]) =>
    row.some(
      (col: string) =>
        col?.trim().replace(/^"/, "").replace(/"$/, "") === "First Name"
    )
  );

  if (headerRowIndex === -1) {
    throw new Error("Could not find header row");
  }

  // Get headers
  const headers = results.data[headerRowIndex].map(
    (h: string) => h?.trim().replace(/^"/, "").replace(/"$/, "") || ""
  );

  // Get all non-empty rows after header
  const allData = results.data
    .slice(headerRowIndex + 1)
    .filter((row) => row.some((cell) => cell?.trim())) // Keep any row that has at least one non-empty cell
    .map((row: string[]) => {
      const obj: Record<string, string> = {};
      headers.forEach((header: string, i: number) => {
        obj[header] = row[i]?.trim().replace(/^"/, "").replace(/"$/, "") || "";
      });
      return obj;
    });

  return {
    totalRows: results.data.length,
    headerRowIndex,
    headers,
    data: allData,
  };
}
