import type {
	AgentRequest,
	AgentResponse,
	AgentContext,
	RemoteAgent,
} from "@agentuity/sdk";
import { generateObject, generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { UserIntentSchema, type ConversationRecord } from "../../lib/types";

const overallSystemPrompt = `
You are a Miami concierge / host helping developers navigate Miami, the React Miami Conference, 
and developer related when it comes to building AI agents on top of Agentuity.
`;

export default async function ConciergeHost(
	req: AgentRequest,
	resp: AgentResponse,
	ctx: AgentContext,
) {
	// For now, this agent is only interfaced via plain text.
	if (req.data.contentType !== "text/plain" && req.data.text.length > 0) {
		return resp.text("Must be plain text to interact with this agent.");
	}

	// Get the user's prompt from the request.
	const userPrompt = req.data.text;

	// We'll use this to store the conversation history later.
	const conversation: ConversationRecord = {
		// Create a unique conversation ID by combining timestamp with a random number
		conversationId: `${Date.now()}_${Math.floor(Math.random() * 10000)}`,
	};

	// Get the past conversation from the KV store for context.
	// const pastConversation = await ctx.kv.get(
	// 	"concierge-history",
	// 	"react-miami-2025-dev-mode",
	// );
	// if (pastConversation.exists) {
	// 	const pastConversationData =
	// 		pastConversation.data.object<ConversationRecord>();
	// 	conversation.history = pastConversationData.history || [];
	// }

	// Determine user's request and intent
	const userIntent = await generateObject({
		model: anthropic("claude-3-7-sonnet-20250219"),
		system: `${overallSystemPrompt} Apart from this, you serve as a central hub that routes user requests to the right available AI agents.
Your task is to determine the user's intent, tag anything relevant, determine the opposite of the user's intent (negative thinking)
to ensure we don't do that - so that we can handle the user's intent in a structured way), then select 
the right agent for the use case.
Take the user's prompt and break these down according to the desired schema indicated.
`,
		schema: UserIntentSchema,
		prompt: userPrompt,
	});

	// Update our conversation record as we go.
	conversation.userIntent = {
		userPrompt,
		...userIntent.object,
	};

	// Routes request and intent to appropriate agent
	const agentType = conversation.userIntent.agentType;
	let agentName: string | undefined;
	const message = `
		Here is the user's intent in stringified JSON: ${JSON.stringify(conversation.userIntent)}
	`;
	let agentResponse: string | undefined;
	switch (agentType) {
		case "miami": {
			console.log(`todo ${agentType}`);
			break;
		}
		case "conference": {
			console.log(`todo ${agentType}`);
			break;
		}
		case "agentuity": {
			agentName = "DeveloperExperience";
			break;
		}
		case "project": {
			console.log(`todo ${agentType}`);
			break;
		}
	}

	ctx.logger.info(`Agent selected: ${agentName}`);

	if (agentName) {
		const agent = await ctx.getAgent({ name: agentName });
		const result = await agent.run({
			data: message,
			contentType: "text/plain",
		});
		agentResponse = result.data.text;
	} else {
		agentResponse = `There wasn't a specific agent found that can address the user's request. Next step is to 
			Get a more detailed request from the user that maps to the supported agents - ask questions to the user related to:
			miami, conference, agentuity, project.  
			Do not respond to the user if it is not related to the agent type categories.
		`;
	}

	// const res = await generateText({
	// 	model: anthropic("claude-3-7-sonnet-20250219"),
	// 	system: `${overallSystemPrompt}`,
	// 	prompt: `
	// 		You just finished handing off the user's request to the different agents involved in making their Miami trip great.

	// 		The break down of the initial request, user prompt, tags, etc. were:
	// 		${JSON.stringify(conversation)}

	// 		The response you got from your agents is:
	// 		${agentResponse || "EMPTY"}

	// 		Please take the agent response and craft a response back to the user that is helpful and clear based
	// 		on the user's request.
	// 	`,
	// });

	const payload = {
		// conciergeResponse: res.text,
		agentResponse,
		...conversation,
	};
	payload.history = [...(conversation.history || []), payload];

	// In a prod app, you'd probably have an ID to identify the conversation.
	// For now, we're just using a static ID.
	// await ctx.kv.set("concierge-history", "react-miami-2025-dev-mode", payload);

	return resp.text(agentResponse);
}
