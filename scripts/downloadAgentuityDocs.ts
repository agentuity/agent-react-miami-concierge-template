import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

async function downloadAgentuityDocs() {
	try {
		const url = "https://agentuity.dev/llms.txt";
		const targetPath = "./src/content/agentuity/llms.txt";

		console.log(`Downloading Agentuity docs from ${url}...`);

		// Fetch the content
		const response = await fetch(url);

		if (!response.ok) {
			throw new Error(
				`Failed to fetch docs: ${response.status} ${response.statusText}`,
			);
		}

		const content = await response.text();

		// Create directory if it doesn't exist
		const dir = dirname(targetPath);
		await mkdir(dir, { recursive: true });

		// Write the file
		await writeFile(targetPath, content, "utf8");

		console.log(`Successfully downloaded Agentuity docs to ${targetPath}`);
	} catch (error) {
		console.error("Error downloading Agentuity docs:", error);
		process.exit(1);
	}
}

// Run the download function
downloadAgentuityDocs();
