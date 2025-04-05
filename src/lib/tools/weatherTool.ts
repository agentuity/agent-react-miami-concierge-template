import { tool } from "ai";
import { z } from "zod";

// Interfaces for NWS API responses
interface NwsPointsProperties {
	gridId?: string;
	gridX?: number;
	gridY?: number;
}

interface NwsPointsResponse {
	properties?: NwsPointsProperties;
}

interface NwsForecastPeriod {
	temperature: number;
	temperatureUnit: string;
	shortForecast: string;
	detailedForecast: string;
}

interface NwsForecastProperties {
	periods?: NwsForecastPeriod[];
}

interface NwsForecastResponse {
	properties?: NwsForecastProperties;
}

// Define the weather tool using NWS API
export const weatherTool = tool({
	description:
		"Get the current weather forecast for a specific location in or near Miami.",
	parameters: z.object({
		location: z
			.string()
			.describe(
				"The location in Miami (e.g., Miami Beach, Downtown Miami) to get the weather forecast for",
			),
	}),
	execute: async ({ location }) => {
		// Hardcoded coordinates for central Miami (replace with geocoding later)
		const latitude = 25.76;
		const longitude = -80.19;
		const userAgent = "MiamiLocalGuide/1.0 (Contact: your-email@example.com)"; // NWS requires a User-Agent

		try {
			// Step 1: Get the grid points from coordinates
			const pointsUrl = `https://api.weather.gov/points/${latitude},${longitude}`;
			// We will declare grid variables after fetching and validating pointsData

			const pointsResponse = await fetch(pointsUrl, {
				headers: { "User-Agent": userAgent },
			});

			if (!pointsResponse.ok) {
				throw new Error(
					`NWS points API request failed: ${pointsResponse.status} ${pointsResponse.statusText}`,
				);
			}

			// Assert type after checking response.ok
			const pointsData = (await pointsResponse.json()) as NwsPointsResponse;

			// Validate and assign grid properties as const
			const gridProps = pointsData.properties;
			if (
				!gridProps ||
				gridProps.gridId === undefined ||
				gridProps.gridX === undefined ||
				gridProps.gridY === undefined
			) {
				throw new Error(
					"Could not extract grid information from NWS points API response.",
				);
			}
			const gridId: string = gridProps.gridId;
			const gridX: number = gridProps.gridX;
			const gridY: number = gridProps.gridY;

			// Step 2: Get the forecast using the grid points
			const forecastUrl = `https://api.weather.gov/gridpoints/${gridId}/${gridX},${gridY}/forecast`;
			const forecastResponse = await fetch(forecastUrl, {
				headers: { "User-Agent": userAgent },
			});

			if (!forecastResponse.ok) {
				throw new Error(
					`NWS forecast API request failed: ${forecastResponse.status} ${forecastResponse.statusText}`,
				);
			}

			// Assert type after checking response.ok
			const forecastData =
				(await forecastResponse.json()) as NwsForecastResponse;
			const currentForecast = forecastData.properties?.periods?.[0];

			if (!currentForecast) {
				throw new Error(
					"Could not extract forecast data from NWS API response.",
				);
			}

			// Return a simplified forecast object
			return {
				location: `Miami area (near ${latitude}, ${longitude})`,
				temperature: currentForecast.temperature,
				unit: currentForecast.temperatureUnit,
				forecast: currentForecast.shortForecast,
				details: currentForecast.detailedForecast,
			};
		} catch (error) {
			console.error(
				`Error fetching weather: ${error instanceof Error ? error.message : String(error)}`,
			);
			return "Sorry, I couldn't retrieve the weather forecast right now. There might be a technical issue.";
		}
	},
});
