# CLAUDE.md - Agentuity Miami Concierge Project

## Commands
- Build: `agentuity build`
- Dev server: `agentuity dev` (watches for changes in src/**)
- Start: `bun run .agentuity/index.js` 
- Deploy: `agentuity deploy` (deploys to Agentuity cloud)

## Code Style Guidelines
- **TypeScript**: Use strict typing with proper interfaces/types
- **Imports**: Order: 1) SDK imports 2) AI libs 3) Project imports
- **Formatting**: Use consistent indentation (2 spaces)
- **Functions**: Use async/await for asynchronous operations
- **Error Handling**: Use try/catch and proper error propagation
- **Naming**: CamelCase for functions/variables, PascalCase for agent names
- **Agent Structure**: Each agent has its own directory with index.ts and README.md

## Project Structure
- Agents defined in `src/agents/[AgentName]/index.ts`
- Agent documentation in `src/agents/[AgentName]/README.md`
- Configuration in `agentuity.yaml`