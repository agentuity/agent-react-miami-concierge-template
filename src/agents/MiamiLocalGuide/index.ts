import type { AgentRequest, AgentResponse, AgentContext } from "@agentuity/sdk";
import { perplexity } from "@ai-sdk/perplexity";
import { generateText } from "ai";
import { weatherTool } from "../../lib/tools/weatherTool";

export default async function MiamiLocalGuideAgent(
	req: AgentRequest,
	resp: AgentResponse,
	ctx: AgentContext,
) {
	// For now, this agent is only interfaced via plain text.
	if (req.data.contentType !== "text/plain" || req.data.text.length === 0) {
		return resp.text(
			"Please send a plain text message to interact with the Miami Local Guide.",
		);
	}

	const prompt = req.data.text;

	try {
		const result = await generateText({
			model: perplexity("sonar-pro"),
			system: `
				You are Miami Local Guide, an AI assistant specializing in Miami, Florida recommendations and information.
				
				Your expertise includes:
				- Miami-specific food and restaurant recommendations with local favorites
				- Entertainment options including museums, attractions, nightlife, and beaches
				- Transportation advice including public transit, ride-sharing, and navigation tips
				- Local cultural context, history, and Miami-specific tips
				- Seasonal events and activities
				- Providing current weather forecasts for Miami locations when asked.

				Always provide specific, actionable information tailored to Miami.
				When making recommendations, include neighborhood information and local context.
				Include relevant details like price ranges, accessibility, and cultural significance.
				If asked for the weather, use the provided tool to get the current forecast and 
				incorporate it naturally into your response. Do not just state the raw tool output, 
				explain it conversationally. For example, instead of just 'temperature: 75, unit: F, 
				forecast: Sunny', say 'The weather looks great right now! It's sunny and about 75 
				degrees Fahrenheit.'
			`,
			prompt: prompt,
			tools: {
				getWeather: weatherTool,
			},
			maxSteps: 5,
		});

		return resp.text(result.text);
	} catch (error) {
		// Use ctx.logger and ensure the error is logged properly
		ctx.logger.error(
			"Error generating response: %s",
			error instanceof Error ? error.message : String(error),
		);
		return resp.text(
			"I'm sorry, I encountered an error while processing your request. Please try again later.",
		);
	}
}
