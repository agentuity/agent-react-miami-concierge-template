import type {
	AgentRequest,
	AgentResponse,
	AgentContext,
	JsonObject,
} from "@agentuity/sdk";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";

export default async function ConferenceExpertAgent(
	req: AgentRequest,
	resp: AgentResponse,
	ctx: AgentContext,
) {
	// Handle both plain text and JSON inputs
	let userPrompt: string;

	if (req.data.contentType === "text/plain" && req.data.text) {
		userPrompt = req.data.text;
	} else if (req.data.contentType === "application/json" && req.data.json) {
		const jsonData = req.data.json as JsonObject;
		userPrompt = jsonData.prompt as string;
		if (!userPrompt) return resp.text("JSON must contain a 'prompt' property.");
	} else {
		return resp.text(
			"This agent accepts 'text/plain' or 'application/json' with a prompt field.",
		);
	}

	// Load the React Miami conference data
	let conferenceData = "";
	try {
		const dataFile = Bun.file("./src/content/conference/llms.txt");
		conferenceData = await dataFile.text();
		ctx.logger.info("Successfully loaded conference data");
	} catch (error) {
		ctx.logger.error(`Failed to load conference data: ${error}`);
	}

	const prompt = req.data.text;

	try {
		const result = await generateText({
			model: anthropic("claude-3-7-sonnet-20250219"),
			system: `
				You are a Conference Expert AI assistant for the React Miami 2025 conference taking place April 17-18, 2025.
				
				Your expertise includes:
				- Complete schedule information (sessions, workshops, events)
				- Speaker profiles, expertise, and presentation details
				- Venue information (Hyatt Regency Miami)
				- Conference logistics and activities
				
				CAPABILITIES:
				- Track and answer questions about sessions, timing, and locations
				- Handle time-based queries (what's happening now, next, this afternoon)
				- Provide recommendations based on attendee interests or session topics
				- Share speaker information, expertise, session titles, and other details
				- Answer questions about venues, transportation, and logistics
				
				IMPORTANT GUIDANCE:
				- Always provide specific, accurate information about the React Miami conference
				- When answering schedule questions, include time, location, and speaker information
				- When discussing speakers, mention their expertise, company, and talk topic
				- Keep answers concise, clear, and focused on the conference
				- If information isn't available in the conference data, acknowledge this rather than making it up
			`,
			prompt: `
				A conference attendee is asking: ${prompt}
				
				Based on the information provided in the conference data, provide a helpful, accurate response.
				Format the information neatly and clearly for easy readability.
				If handling a schedule or speaker query, structure your response in a well-organized format.
				
				---
				
				React Miami Conference Data:
				${conferenceData}
			`,
		});

		return resp.text(result.text);
	} catch (error) {
		ctx.logger.error(`Error generating response: ${error}`);
		return resp.text(
			"I'm sorry, I encountered an error while processing your request. Please try again later.",
		);
	}
}
