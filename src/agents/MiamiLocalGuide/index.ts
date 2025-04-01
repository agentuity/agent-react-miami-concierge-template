import type { AgentRequest, AgentResponse, AgentContext } from "@agentuity/sdk";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";

export default async function MiamiLocalGuideAgent(
	req: AgentRequest,
	resp: AgentResponse,
	ctx: AgentContext,
) {
	// For now, this agent is only interfaced via plain text.
	if (req.data.contentType !== "text/plain" && req.data.text.length > 0) {
		return resp.text(
			"Please send a plain text message to interact with the Miami Local Guide.",
		);
	}

	const prompt = req.data.text;

	try {
		const result = await generateText({
			model: google("gemini-2.5-pro-exp-03-25", {
				useSearchGrounding: true,
			}),
			system: `
				You are Miami Local Guide, an AI assistant specializing in Miami, Florida recommendations and information.
				
				Your expertise includes:
				- Miami-specific food and restaurant recommendations with local favorites
				- Entertainment options including museums, attractions, nightlife, and beaches
				- Transportation advice including public transit, ride-sharing, and navigation tips
				- Local cultural context, history, and Miami-specific tips
				- Seasonal events and activities

				Always provide specific, actionable information tailored to Miami.
				When making recommendations, include neighborhood information and local context.
				Include relevant details like price ranges, accessibility, and cultural significance.
				
				For each response, ALWAYS include the sources of your information as references at the end.
			`,
			prompt: prompt,
			// Enable web search to get real-time information
			providerOptions: {
				google: {
					safetySettings: [
						{
							category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
							threshold: "BLOCK_ONLY_HIGH",
						},
						{
							category: "HARM_CATEGORY_HATE_SPEECH",
							threshold: "BLOCK_ONLY_HIGH",
						},
						{
							category: "HARM_CATEGORY_HARASSMENT",
							threshold: "BLOCK_ONLY_HIGH",
						},
						{
							category: "HARM_CATEGORY_DANGEROUS_CONTENT",
							threshold: "BLOCK_ONLY_HIGH",
						},
					],
					// Using web search for real-time information
					tools: [
						{
							type: "GoogleSearchRetrieval",
						},
					],
				},
			},
		});

		ctx.logger.info(
			`Generated response with sources: ${result.sources ? `${result.sources.length} sources found` : "No sources found"}`,
		);

		// Format response with sources
		let formattedResponse = result.text;

		// Add sources if available
		if (result.sources && result.sources.length > 0) {
			formattedResponse = `${formattedResponse}\n\n### Sources:\n`;
			result.sources.forEach((source, index) => {
				formattedResponse = `${formattedResponse}${index + 1}. [${source.title || "Source"}](${source.url})\n`;
			});
		}

		return resp.text(formattedResponse);
	} catch (error) {
		ctx.logger.error(`Error generating response: ${error}`);
		return resp.text(
			"I'm sorry, I encountered an error while processing your request. Please try again later.",
		);
	}
}
