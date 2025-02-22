import { NextResponse } from "next/server";
import { parseSurveyCSV } from "./utils";

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

    const result = await parseSurveyCSV(filename);
    return NextResponse.json(result.data);
  } catch (error) {
    console.error("Error processing survey data:", error);
    return NextResponse.json(
      { error: "Failed to process survey data" },
      { status: 500 }
    );
  }
}
