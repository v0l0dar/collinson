import { createGraphQLError, createSchema } from "graphql-yoga";
import { searchPlaces, fetchWeek } from "./openMeteo.js";
import { scoreDay } from "./scoring/index.js";
import { UpstreamError } from "./types.js";

const typeDefs = /* GraphQL */ `
  type Query {
    searchPlaces(query: String!): [PlaceInfo!]!
    forecast(latitude: Float!, longitude: Float!, name: String!, country: String!): PlaceForecast!
  }

  type PlaceForecast {
    place: PlaceInfo!
    days: [DayForecast!]!
  }

  type PlaceInfo {
    name: String!
    country: String!
    admin1: String
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

function upstreamOrRethrow(error: unknown, message: string): never {
  if (error instanceof UpstreamError) {
    throw createGraphQLError(message, { extensions: { code: "UPSTREAM_ERROR" } });
  }
  throw error;
}

export const schema = createSchema({
  typeDefs,
  resolvers: {
    Query: {
      // The frontend calls this as the user types, so a place is always
      // picked from real candidates instead of us silently guessing.
      searchPlaces: async (_parent: unknown, args: { query: string }) => {
        const query = args.query.trim();
        if (query.length < 2) return [];
        try {
          return await searchPlaces(query);
        } catch (error) {
          upstreamOrRethrow(error, "The place search did not answer. Please try again.");
        }
      },
      forecast: async (
        _parent: unknown,
        args: { latitude: number; longitude: number; name: string; country: string },
      ) => {
        try {
          const days = await fetchWeek(args.latitude, args.longitude);
          return {
            place: {
              name: args.name,
              country: args.country,
              admin1: null,
              latitude: args.latitude,
              longitude: args.longitude,
            },
            days: days.map(scoreDay),
          };
        } catch (error) {
          upstreamOrRethrow(error, "The weather service did not answer. Please try again.");
        }
      },
    },
  },
});
