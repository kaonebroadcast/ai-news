import { NextRequest, NextResponse } from "next/server";
import { withKeyRotation } from "@/lib/ai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { GenerateRequestBody, NewsFormat } from "@/types/news";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, category, location, brief, baseContent, instructions, format, options } =
      body as GenerateRequestBody;

    const safeTitle = (title && title.trim()) || "સમાચાર રિપોર્ટ";

    // Helper to normalize content from AI message objects
    const normalizeContent = (ai: { content: unknown }): string =>
      typeof ai.content === "string" ? ai.content : String(ai.content);

    // If baseContent or instructions are provided, treat as rewrite/regenerate flow
    if ((baseContent && baseContent.trim()) || (instructions && instructions.trim())) {
      const system = new SystemMessage(
        "You are a professional Gujarati broadcast news anchor and editor. Rewrite or edit the provided news article per the user's instructions strictly in Gujarati language, maintaining a neutral, formal anchor-style tone. Use markdown format, preserve key facts; if adding, mark as assumptions."
      );
      const user = new HumanMessage(
        `Title: ${safeTitle}\nCategory: ${category ?? "General"}\nLocation: ${location ?? "N/A"}\nBrief/context: ${brief ?? ""}\n\nCurrent article (markdown):\n\n${baseContent ?? ""}\n\nInstructions: ${instructions ?? "Revise and improve clarity keeping the same facts."}\n\nReturn the full updated article in Gujarati only, markdown only. Include a 'સારાંશ' section at the end.`
      );
      
      // Use withKeyRotation to handle API key rotation automatically
      const content = await withKeyRotation(async (model) => {
        const aiRes = await model.invoke([system, user]);
        return normalizeContent(aiRes as { content: unknown });
      });
      
      return NextResponse.json({ content });
    }

    // Fresh generation flow with format-specific prompts
    const system = new SystemMessage(
      "You are a professional Gujarati broadcast news anchor and editor. Write output strictly in Gujarati with a neutral, formal anchor-style tone. Use markdown. Avoid sensationalism. If facts are missing, clearly state assumptions. CRITICAL: Obey the requested structure EXACTLY. For every section that specifies a count (e.g., Top Band (6 words), VO Script Write a single paragraph in Gujarati. Keep it detailed and comprehensive. Do not use numbers or bullet points., Express lines, Rundown stories), output EXACTLY that many items—no more, no less. For Top Bands, each must be exactly 6 words. Do NOT add extra bullets, do NOT omit any. Do NOT leave any numbered item blank; each item must contain a complete, meaningful sentence in Gujarati. Do NOT reorder any pre-listed, numbered, or topic-tagged lines provided in the template."
    );

    const fmt: NewsFormat | undefined = format as NewsFormat | undefined;
    let topBandCount = Math.max(1, Math.min(10, options?.topBandCount ?? 5));
    let voCount = Math.max(1, Math.min(12, options?.voCount ?? 5));

    // AV format has fixed counts: Anchor Script (90-110 words) + Top Band (5 words)
    if (fmt === "AV") {
      voCount = 7;
      topBandCount = 5;
    }

    function userPrompt(): string {
      const header = `શીર્ષક: ${safeTitle}\nવિભાગ: ${category ?? "General"}\nસ્થળ: ${location ?? "N/A"}\nસંદર્ભ: ${brief ?? ""}`;
      switch (fmt) {
        case "AV": 
          return `${header}

આઉટપુટ બંધારણ (Gujarati only, markdown only):
# ${safeTitle}

## Anchor Script
(Write a single paragraph in Gujarati between 90 and 110 words. Do NOT use any numbered format like 1), 2), 3). Write one continuous flowing paragraph with complete sentences and detailed content.)

## Top Band (5 words each)
${Array.from({ length: 5 }).map(() => "- ").join("\n")}`;

        case "PKG": {
          const voSections = [];
          for (let i = 0; i < voCount; i++) {
            voSections.push(`## VO Script ${i + 1} (140-150 words)\n(Write a single paragraph in Gujarati between 140 and 150 words. Keep it detailed and comprehensive. Do not use numbers or bullet points.)`);
          }
          return `${header}

આઉટપુટ બંધારણ (Gujarati only, markdown only):
# ${safeTitle}

## Anchor Opening
(Write a single continuous summary in Gujarati between 30 and 40 words. Do NOT use numbered points. Write flowing prose only.)

${voSections.join('\n\n')}

## Anchor Closing Summary
(Write a single continuous summary in Gujarati between 40 and 50 words. Do NOT use numbered points. Write flowing prose only.)

## Top Band (6 words each)
${Array.from({ length: 5 }).map(() => "- ").join("\n")}`;
        }

        case "AV_GFX":
          return `${header}\n\nઆઉટપુટ બંધારણ (Gujarati only, markdown only):\n# ${safeTitle}\n\n## Story\n(Write a 150-word story in Gujarati. Keep it concise and focused on the key points.)\n\n## Top Bands (${topBandCount})\n${Array.from({ length: topBandCount }).map(() => "- ").join("\n")}`;

        case "EXPRESS":
          return `Write a 60-word summary in Gujarati about: ${brief || safeTitle}. Focus on key facts only, no formatting, no sections, just plain text. Do not include any markdown, headers, or additional text.`;

        case "SPECIAL": {
          const voSections = [];
          for (let i = 0; i < voCount; i++) {
            voSections.push(`## VO Script ${i + 1} (30-line paragraph)\n(Write a single 30-line paragraph in Gujarati. Keep it detailed and comprehensive. Do not use numbers or bullet points.)`);
          }
          return `${header}

# ${safeTitle}

## Anchor Opening (8 lines)
1)
2)
3)
4)
5)
6)
7)
8)

${voSections.join('\n\n')}

## Anchor Closing Summary (5 lines)
1)
2)
3)
4)
5)

## Top Band (5 words each)
${Array.from({ length: 5 }).map(() => "- સમાચાર રિપોર્ટ ટાઇટલ").join("\n")}

## Top Band GFX (5 words each × 3 variants)
${Array.from({ length: 5 }).map((_, i) => `${i + 1}) A) સમાચાર રિપોર્ટ ટાઇટલ  B) સમાચાર રિપોર્ટ ટાઇટલ  C) સમાચાર રિપોર્ટ ટાઇટલ`).join("\n")}`;
        }

        default:
          // Backward-compatible generic article with summary
          const defaultPrompt = [
            'Write a complete news report. Output must be in Gujarati only.',
            `Title: ${safeTitle}`,
            `Category: ${category ?? "General"}`,
            `Location: ${location ?? "N/A"}`,
            `Brief/context: ${brief ?? ""}
            
Requirements:
- Use a professional Gujarati news anchor tone: precise, neutral, formal, clear.
- 6-10 short paragraphs with clear sections and a concise intro.
- Include key facts, quotes (if not provided, mark as attributed or hypothetical), dates, numbers when relevant.
- Include a short summary at the end under \'સારાંશ\'.
- Output markdown only and Gujarati only.`
          ].join('\n');
          return defaultPrompt;
      }
    }

    const user = new HumanMessage(userPrompt());
    
    // Use withKeyRotation to handle API key rotation automatically
    const content = await withKeyRotation(async (model) => {
      if (fmt === "EXPRESS") {
        // For EXPRESS format, use a simplified system prompt
        const expressSystem = new SystemMessage("You are a professional Gujarati news writer. Write a 60-word summary in Gujarati based on the provided information. Include only the summary text, no formatting, no sections, just plain text.");
        const expressUser = new HumanMessage(`Write a 60-word summary about: ${brief || safeTitle}`);
        const aiRes = await model.invoke([expressSystem, expressUser]);
        return normalizeContent(aiRes as { content: unknown }).trim();
      } else {
        // For other formats, use the original processing
        const aiRes = await model.invoke([system, user]);
        let result = normalizeContent(aiRes as { content: unknown });
        
        // Safety: ensure no blank numbered items for AV anchor lines
        if (fmt === "AV") {
          const filler = "આજના મુખ્ય મુદ્દા પર એક સંક્ષિપ્ત, સ્પષ્ટ વાક્ય.";
          result = result.replace(/^(\s*\d+\)\s*)$/gm, (_, p1: string) => `${p1}${filler}`);
        }
        return result;
      }
    });

    return NextResponse.json({ content });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    console.error("POST /api/news/generate error", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
