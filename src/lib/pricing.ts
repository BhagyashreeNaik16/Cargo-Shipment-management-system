// src/lib/pricing.ts
import type { Booking } from '@/types/booking-types'; // Import Booking type if needed for context, or define a specific input type
import { getAppSettings } from '@/stores/settings-store'; // Import function to get settings

// Define the input type for the pricing function
export interface PricingInput {
  weight?: number;
  volume?: number;
  cargoType?: string;
  origin?: string;
  destination?: string;
  numberOfItems?: number;
}

// Function to calculate estimated price, now using settings store
export const calculateEstimatedPrice = (data: PricingInput): { price: number; rateUsed: string } => {
  const settings = getAppSettings(); // Get current settings
  const { weight, volume, cargoType, origin, destination, numberOfItems } = data; // Destructure from input type

  // --- Pricing Logic Constants from Settings Store ---
  const BASE_RATE_PER_KG = settings.pricing.baseRateKg || 50; // Fallback to default
  const BASE_RATE_PER_M3 = settings.pricing.baseRateM3 || 2000;
  const BASE_FLAT_FEE = 100; // Keeping this constant for now, could be moved to settings
  const DISTANCE_MULTIPLIER = settings.pricing.distanceMultiplier || 1.1;
  const MULTI_ITEM_SURCHARGE = settings.pricing.multiItemSurcharge || 50;

  // Surcharges from settings (converted from percentage)
  const CARGO_TYPE_SURCHARGES: Record<string, number> = {
    Perishable: (settings.pricing.perishableSurchargePercent || 0) / 100,
    Hazardous: (settings.pricing.hazardousSurchargePercent || 0) / 100,
    Fragile: (settings.pricing.fragileSurchargePercent || 0) / 100,
    Oversized: (settings.pricing.oversizedSurchargePercent || 0) / 100,
  };

  // Specific long haul multipliers - could also be moved to settings if more complex logic is needed
  const LONG_HAUL_MULTIPLIER_NY_LA = 1.5;
  const LONG_HAUL_MULTIPLIER_BOS_SF = 1.45;
  // --- End of Pricing Logic Constants ---


    if (!weight && !volume) {
        return { price: 0, rateUsed: "Enter weight or volume" };
    }

    let calculatedPrice = BASE_FLAT_FEE;
    let rateUsed = `Base Fee ₹${BASE_FLAT_FEE}`;

    // Calculate based on weight OR volume, whichever yields a higher price (common practice)
    const priceByWeight = weight ? weight * BASE_RATE_PER_KG : 0;
    const priceByVolume = volume ? volume * BASE_RATE_PER_M3 : 0;

    if (priceByWeight > priceByVolume) {
        calculatedPrice += priceByWeight;
        rateUsed += ` + ₹${BASE_RATE_PER_KG.toFixed(2)}/kg`;
    } else if (priceByVolume > 0) {
        calculatedPrice += priceByVolume;
        rateUsed += ` + ₹${BASE_RATE_PER_M3.toFixed(2)}/m³`;
    } else {
         // If only base fee applies (shouldn't happen with weight/volume check, but safeguard)
         rateUsed = "Base Fee Only";
    }

    // Apply surcharge based on cargo type
    if (cargoType && CARGO_TYPE_SURCHARGES[cargoType] > 0) {
        const surchargeAmount = calculatedPrice * CARGO_TYPE_SURCHARGES[cargoType];
        calculatedPrice += surchargeAmount;
        rateUsed += ` + ${settings.pricing[cargoType.toLowerCase() + 'SurchargePercent']}% ${cargoType}`;
    }

    // Simple distance factor (very basic - can be improved)
    const originLower = origin?.trim().toLowerCase();
    const destinationLower = destination?.trim().toLowerCase();

    if (originLower && destinationLower && originLower !== destinationLower) {
         let appliedMultiplier = 1;
         let multiplierDesc = '';
         // Check for specific long-haul routes first
         if (
            (originLower.includes("new york") && destinationLower.includes("los angeles")) ||
            (originLower.includes("los angeles") && destinationLower.includes("new york"))
         ) {
              appliedMultiplier = LONG_HAUL_MULTIPLIER_NY_LA;
              multiplierDesc = ` (Long Haul NY-LA x${appliedMultiplier})`;
         } else if (
             (originLower.includes("boston") && destinationLower.includes("san francisco")) ||
             (originLower.includes("san francisco") && destinationLower.includes("boston"))
         ) {
             appliedMultiplier = LONG_HAUL_MULTIPLIER_BOS_SF;
             multiplierDesc = ` (Long Haul BOS-SF x${appliedMultiplier})`;
         } else {
             // Apply generic distance multiplier if origin/destination differ but aren't specific long routes
             appliedMultiplier = DISTANCE_MULTIPLIER;
              multiplierDesc = ` (Distance Factor x${appliedMultiplier})`;
         }
          calculatedPrice *= appliedMultiplier;
          rateUsed += multiplierDesc;
    }

     // Apply surcharge for multiple items
    if (numberOfItems && numberOfItems > 2) {
      calculatedPrice += MULTI_ITEM_SURCHARGE;
      rateUsed += ` + ₹${MULTI_ITEM_SURCHARGE} Multi-item`;
    }


    return { price: calculatedPrice > BASE_FLAT_FEE ? Math.round(calculatedPrice) : Math.round(BASE_FLAT_FEE), rateUsed }; // Ensure minimum is base fee, round to nearest INR
};
