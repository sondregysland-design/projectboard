import { getOpenAI } from "@/lib/openai";
import { requireApiAuth, handleApiError } from "@/lib/api-auth";

export async function POST(request: Request) {
  try {
    await requireApiAuth();
    const body = await request.json();
    const { text } = body;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return Response.json({ error: "Text is required" }, { status: 400 });
    }

    const openai = getOpenAI();

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 2000,
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content: `Du er en korrekturleser. Korriger rettskriving og grammatikk i teksten under.

Regler:
- Behold samme språk som input (norsk inn → norsk ut, engelsk inn → engelsk ut)
- Bruk enkle, naturlige ord. Ikke bytt ut vanlige ord med vanskelige synonymer.
- Ikke endre mening eller tone
- Ikke legg til eller fjern innhold
- Teksten skal lese naturlig, som om et menneske skrev den
- Returner KUN den korrigerte teksten, ingen forklaringer`,
        },
        {
          role: "user",
          content: text,
        },
      ],
    });

    const corrected = completion.choices[0]?.message?.content?.trim() || text;

    return Response.json({ corrected });
  } catch (error) {
    return handleApiError(error, "Failed to proofread text");
  }
}
