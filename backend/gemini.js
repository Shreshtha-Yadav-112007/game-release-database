const { GoogleGenAI } = require("@google/genai");

require("dotenv").config();

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

function buildReleaseSummaryPrompt(gameTitle, releases) { //Prompt engineering
    return `
You are a video game release data analyst.

Your task is to analyze the release information provided for the game below.

Use only the supplied release data.
Do not invent or assume platforms, regions, release dates, release formats, or other facts.

Game:
${gameTitle}

Release data:
${JSON.stringify(releases, null, 2)}

Analyze:
1. The total number of releases.
2. The platforms represented.
3. The regions represented.
4. The release formats represented.
5. Any notable patterns visible in the supplied data.

Provide a concise summary based only on the supplied information.
`;
}

const releaseSummarySchema = { //Structured outputs
    type: "object",
    properties: {
        summary: {
            type: "string",
            description: "A concise summary based only on the supplied release data."
        },
        releaseCount: {
            type: "integer",
            description: "Total number of release records supplied."
        },
        platforms: {
            type: "array",
            items: {
                type: "string"
            },
            description: "Platforms present in the supplied release data."
        },
        regions: {
            type: "array",
            items: {
                type: "string"
            },
            description: "Regions present in the supplied release data."
        },
        releaseFormats: {
            type: "array",
            items: {
                type: "string"
            },
            description: "Release formats present in the supplied release data."
        },
        notablePatterns: {
            type: "array",
            items: {
                type: "string"
            },
            description: "Patterns directly observable from the supplied release data."
        }
    },
    required: [
        "summary",
        "releaseCount",
        "platforms",
        "regions",
        "releaseFormats",
        "notablePatterns"
    ]
};

async function generateText(prompt) {
    const response = await ai.models.generateContent({
        model: "gemini-3.5-flash-lite",
        contents: prompt
    });

    return response.text;
}

async function generateStructuredReleaseSummary(prompt) { //Gemini API call for structured output
    const response = await ai.models.generateContent({
        model: "gemini-3.5-flash-lite",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: releaseSummarySchema
        }
    });

    return JSON.parse(response.text);
}

module.exports = {
    generateText,
    buildReleaseSummaryPrompt,
    generateStructuredReleaseSummary
};