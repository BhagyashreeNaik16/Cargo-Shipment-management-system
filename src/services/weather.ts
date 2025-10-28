/**
 * Represents a geographical location with latitude and longitude coordinates.
 */
export interface Location {
  /**
   * The latitude of the location.
   */
  lat: number;
  /**
   * The longitude of the location.
   */
lng: number;
}

/**
 * Represents weather information, including temperature and conditions.
 */
export interface Weather {
  /**
   * The temperature in Fahrenheit.
   */
  temperatureFarenheit: number;
  /**
   * The weather conditions (e.g., Sunny, Cloudy, Rainy).
   */
  conditions: string;
}

// Expanded list of possible conditions with higher chance of "alert" types
const possibleConditions = [
    { name: 'Sunny', alert: false },
    { name: 'Partly Cloudy', alert: false },
    { name: 'Cloudy', alert: false },
    { name: 'Light Rain', alert: false },
    { name: 'Heavy Rain', alert: true }, // Alert condition
    { name: 'Thunderstorm', alert: true }, // Alert condition
    { name: 'Snowy', alert: true }, // Alert condition
    { name: 'Foggy', alert: true }, // Alert condition
    { name: 'Windy', alert: false },
    { name: 'High Wind', alert: true }, // Alert condition
    { name: 'Freezing Rain', alert: true }, // Alert condition
    { name: 'Haze', alert: false },
    // Add more alert conditions to increase probability
    { name: 'Heavy Rain', alert: true },
    { name: 'Thunderstorm', alert: true },
    { name: 'Snowy', alert: true },
    { name: 'Foggy', alert: true },
    { name: 'High Wind', alert: true },
    { name: 'Freezing Rain', alert: true },
];


/**
 * Asynchronously retrieves weather information for a given location.
 *
 * This is a MOCK implementation. In a real application, you would call a
 * real weather API (like OpenWeatherMap, WeatherAPI, etc.) using the lat/lng.
 *
 * @param location The location for which to retrieve weather data.
 * @returns A promise that resolves to a Weather object containing temperature and conditions.
 */
export async function getWeather(location: Location): Promise<Weather> {
  console.log(`Fetching mock weather for coordinates: Lat ${location.lat}, Lng ${location.lng}`);

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));

  // Improved randomization for conditions - now more likely to pick alert conditions
  const randomConditionIndex = Math.floor(Math.random() * possibleConditions.length);
  const selectedCondition = possibleConditions[randomConditionIndex];

  // Generate random temperature (Fahrenheit) - wider range
  let temperature = Math.floor(Math.random() * 75) + 10; // Range: 10°F to 85°F

  // Adjust temperature based on condition slightly
   if (selectedCondition.name.includes("Snow") || selectedCondition.name.includes("Freezing")) {
     temperature = Math.floor(Math.random() * 25) + 5; // 5°F to 30°F
   } else if (selectedCondition.name.includes("Sun")) {
      temperature = Math.max(temperature, 65); // Ensure sunny is relatively warm
   } else if (selectedCondition.name.includes("Rain")) {
      temperature -= 5; // Cooler when raining
   }


  console.log(`Mock weather result: ${temperature}°F, ${selectedCondition.name}`);

  return {
    temperatureFarenheit: temperature,
    conditions: selectedCondition.name,
  };
}
