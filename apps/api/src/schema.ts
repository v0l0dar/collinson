import { createGraphQLError, createSchema } from "graphql-yoga";
import { geocodePlace, fetchWeek } from "./openMeteo.js";
import { scoreDay } from "./scoring/index.js";
import { PlaceNotFoundError, UpstreamError } from "./types.js";

const typeDefs = /* GraphQL */ `
  type Query {
    forecast(place: String!): PlaceForecast!
  }

  type PlaceForecast {
    place: PlaceInfo!
    days: [DayForecast!]!
  }

  type PlaceInfo {
    name: String!
    country: String!
    latitude: Float!
    longitude: Float!
  }

  type DayForecast {
    date: String!
    activities: [ActivityScore!]!
  }

  type ActivityScore {
    activity: Activity!
    score: Int
    label: String!
    reasons: [String!]!
  }

  enum Activity {
    SKIING
    SURFING
    OUTDOOR_SIGHTSEEING
    INDOOR_SIGHTSEEING
  }
`;

export const schema = createSchema({
  typeDefs,
  resolvers: {
    Query: {
      forecast: async (_parent: unknown, args: { place: string }) => {
        const place = args.place.trim();
        if (!place) {
          throw createGraphQLError("Please enter a place name.", {
            extensions: { code: "PLACE_NOT_FOUND" },
          });
        }
        try {
          const placeInfo = await geocodePlace(place);
          const days = await fetchWeek(placeInfo);
          return {
            place: placeInfo,
            days: days.map(scoreDay),
          };
        } catch (error) {
          if (error instanceof PlaceNotFoundError) {
            throw createGraphQLError(`We cannot find "${place}".`, {
              extensions: { code: "PLACE_NOT_FOUND" },
            });
          }
          if (error instanceof UpstreamError) {
            throw createGraphQLError("The weather service did not answer. Please try again.", {
              extensions: { code: "UPSTREAM_ERROR" },
            });
          }
          throw error;
        }
      },
    },
  },
});
