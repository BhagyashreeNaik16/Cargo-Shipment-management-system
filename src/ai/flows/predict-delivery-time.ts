// src/ai/flows/predict-delivery-time.ts
'use server';
/**
 * @fileOverview Predicts the delivery time of a shipment based on its current location and historical data.
 *
 * - predictDeliveryTime - A function that predicts the delivery time of a shipment.
 * - PredictDeliveryTimeInput - The input type for the predictDeliveryTime function.
 * - PredictDeliveryTimeOutput - The return type for the predictDeliveryTime function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const PredictDeliveryTimeInputSchema = z.object({
  currentLocation: z
    .string()
    .describe('The current location of the shipment.'),
  shipmentHistory: z
    .string()
    .describe(
      'Historical data of the shipment, including timestamps and locations.'
    ),
  destination: z.string().describe('The final destination of the shipment.'),
});
export type PredictDeliveryTimeInput = z.infer<typeof PredictDeliveryTimeInputSchema>;

const PredictDeliveryTimeOutputSchema = z.object({
  estimatedDeliveryTime: z
    .string()
    .describe('The estimated delivery time of the shipment.'),
  confidenceLevel: z
    .number()
    .describe(
      'A number between 0 and 1 indicating the confidence level of the prediction.'
    ),
  reasons: z.string().describe('Reasons for the predicted delivery time.'),
});
export type PredictDeliveryTimeOutput = z.infer<typeof PredictDeliveryTimeOutputSchema>;

export async function predictDeliveryTime(
  input: PredictDeliveryTimeInput
): Promise<PredictDeliveryTimeOutput> {
  return predictDeliveryTimeFlow(input);
}

const predictDeliveryTimePrompt = ai.definePrompt({
  name: 'predictDeliveryTimePrompt',
  input: {
    schema: z.object({
      currentLocation: z
        .string()
        .describe('The current location of the shipment.'),
      shipmentHistory: z
        .string()
        .describe(
          'Historical data of the shipment, including timestamps and locations.'
        ),
      destination: z.string().describe('The final destination of the shipment.'),
    }),
  },
  output: {
    schema: z.object({
      estimatedDeliveryTime: z
        .string()
        .describe('The estimated delivery time of the shipment.'),
      confidenceLevel: z
        .number()
        .describe(
          'A number between 0 and 1 indicating the confidence level of the prediction.'
        ),
      reasons: z.string().describe('Reasons for the predicted delivery time.'),
    }),
  },
  prompt: `You are an AI assistant specializing in predicting shipment delivery times.

  Based on the current location, shipment history, and destination, predict the delivery time of the shipment.

  Current Location: {{{currentLocation}}}
  Shipment History: {{{shipmentHistory}}}
  Destination: {{{destination}}}

  Provide the estimated delivery time, a confidence level (0 to 1), and the reasons for your prediction.`,
});

const predictDeliveryTimeFlow = ai.defineFlow<
  typeof PredictDeliveryTimeInputSchema,
  typeof PredictDeliveryTimeOutputSchema
>(
  {
    name: 'predictDeliveryTimeFlow',
    inputSchema: PredictDeliveryTimeInputSchema,
    outputSchema: PredictDeliveryTimeOutputSchema,
  },
  async input => {
    const {output} = await predictDeliveryTimePrompt(input);
    return output!;
  }
);
