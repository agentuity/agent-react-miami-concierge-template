import type {
	AgentRequest,
	AgentResponse,
	AgentContext,
	JsonObject,
} from "@agentuity/sdk";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";

export default async function DeveloperExperienceAgent(
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

	// Load the Agentuity documentation
	let agentuityDocs = "";
	try {
		const docsFile = Bun.file("./src/content/agentuity/llms.txt");
		agentuityDocs = await docsFile.text();
	} catch (error) {
		ctx.logger.error("Failed to load Agentuity documentation: %s", error);
	}

	const prompt = req.data.text;
	const result = await generateText({
		model: anthropic("claude-3-7-sonnet-20250219"),
		system: `
			You are a helpful developer evangelist that knows everything about Agentuity AI agent cloud platform.
			You are an expert at the Agentuity doc site: www.agentuity.dev

			Your goal is to answer any questions regarding how agentuity works (CLI, SDKs, web app, and more).
			Focus on providing accurate information from the Agentuity documentation.
		`,
		prompt: `
			A user is inquiring about Agentuity - here is the details of the user's request: 
			${prompt}

			Based on the user's request, the tools and information you have available, 
			please provide a relevant and contextual answer 
      to the user.  If there is not a relevant one based on the information provided, 
			then please just say you don't know and refer the user to agentuity.dev.
			We only really care about sources from the Agentuity documentation.
			DO NOT make up any information or infer anything else that isn't in the documentation below.
			Always include at the top a link to the Agentuity documentation: www.agentuity.dev

			---

			Here is the Agentuity documentation:
			${agentuityDocs}
		`,
	});

	return resp.text(result.text);
}
