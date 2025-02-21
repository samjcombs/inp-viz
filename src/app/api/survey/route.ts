import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    if (!type || !["opening", "closing"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid survey type" },
        { status: 400 }
      );
    }

    const filename =
      type === "opening"
        ? "Black+History+Retreat+Survey+(Opening+Survey).csv"
        : "Black+Futures+Retreat+Survey+(Closing+Survey).csv";

    // Use path relative to the API route directory
    const filePath = path.join(
      process.cwd(),
      "src/app/api/survey/_data",
      filename
    );
    console.log("Attempting to read file from:", filePath);

    const fileContents = await fs.readFile(filePath, "utf8");

    return new NextResponse(fileContents, {
      headers: {
        "Content-Type": "text/csv",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Error reading survey file:", error);
    return NextResponse.json(
      { error: "Failed to load survey data" },
      { status: 500 }
    );
  }
}
