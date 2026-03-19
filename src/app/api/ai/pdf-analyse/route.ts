import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { text, prompt, fileName } = await req.json();

    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json(
        { error: "PDF-tekst er påkrevd" },
        { status: 400 }
      );
    }

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json(
        { error: "Analyse-prompt er påkrevd" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI API-nøkkel er ikke konfigurert" },
        { status: 500 }
      );
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "Du er en ekspert på oljebrønnsdokumenter og bore-operasjoner. Du analyserer PDFer og trekker ut presise tekniske verdier.",
          },
          {
            role: "user",
            content: `Filnavn: ${fileName || "ukjent"}\n\n${prompt}\n\n--- DOKUMENTTEKST ---\n${text}`,
          },
        ],
        temperature: 0.2,
        max_tokens: 8192,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error("OpenAI API error:", err);
      return NextResponse.json(
        { error: "Feil fra AI-tjenesten" },
        { status: 502 }
      );
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content?.trim() ?? "";

    return NextResponse.json({ result });
  } catch (error) {
    console.error("PDF-analyse error:", error);
    return NextResponse.json(
      { error: "Intern serverfeil" },
      { status: 500 }
    );
  }
}
