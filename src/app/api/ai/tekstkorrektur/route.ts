import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json(
        { error: "Tekst er påkrevd" },
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
              "Du er et tekstrettingsverktøy. Rett grammatikk, stavefeil og setningsoppbygging. Behold innholdet og meningen. Bruk profesjonell men naturlig tone. Returner KUN den rettede teksten.",
          },
          {
            role: "user",
            content: text,
          },
        ],
        temperature: 0.3,
        max_tokens: 4096,
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
    const corrected = data.choices?.[0]?.message?.content?.trim() ?? "";

    return NextResponse.json({ corrected });
  } catch (error) {
    console.error("Tekstkorrektur error:", error);
    return NextResponse.json(
      { error: "Intern serverfeil" },
      { status: 500 }
    );
  }
}
