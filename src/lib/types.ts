import { z } from "zod";

export interface UserIntent {
	agentType: "miami" | "conference" | "agentuity" | "other";
	tags: string[];
	likelyIntent: string;
	negativeIntent: string;
	userPrompt: string;
}

export const UserIntentSchema = z.object({
	agentType: z.enum(["miami", "conference", "agentuity"]),
	tags: z.array(z.string()),
	likelyIntent: z.string(),
	negativeIntent: z.string(),
	userPrompt: z.string().optional(),
});

export interface ConversationRecord {
	userIntent?: UserIntent;
	conciergeResponse?: string;
	agentResponse?: string;
	conversationId: string;
	history?: ConversationRecord[];
}
