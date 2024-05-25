import { Prisma, Trip } from "@prisma/client";
import { IUser } from "../../middleware/jwtUser";
import { prisma } from "../../utils/prisma";

const createTripIntoDB = async (trip: Trip, user: IUser): Promise<Trip> => {
  return await prisma.trip.create({ data: { ...trip, userId: user.id } });
};

// get paginated and filtered trips
// Query Parameters for API Requests:

// When interacting with the API, you can utilize the following query parameters to customize and filter the results according to your preferences.

// destination: (Optional) Filter trips by destination.
// startDate: (Optional) Filter trips by start date.
// endDate: (Optional) Filter trips by end date.
// budget: (Optional) Filter trips by budget range. Example: ?minBudget=100&maxBudget=10000
// searchTerm: (Optional) Searches for trips based on a keyword or phrase. Only applicable to the following fields: destination, budget, etc.
// page: (Optional) Specifies the page number for paginated results. Default is 1. Example: ?page=2
// limit: (Optional) Sets the number of data per page. Default is 10. Example: ?limit=5
// sortBy: (Optional) Specifies the field by which the results should be sorted. Only applicable to the following fields: destination, budget. Example: ?sortBy=budget
// sortOrder: (Optional) Determines the sorting order, either 'asc' (ascending) or 'desc' (descending). Example: ?sortOrder=desc

interface IQuery {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: string;
  destination: string;
  startDate: string;
  endDate: string;
  minBudget: number;
  maxBudget: number;
  searchTerm: string;
}

const getPaginatedAndFilteredTrips = async (query: Partial<IQuery>) => {
  console.log({ fromService: query });

  const {
    page = 1,
    limit = 10,
    sortBy = "budget",
    sortOrder = "asc",
    minBudget,
    maxBudget,
    searchTerm,
    ...filterData
  } = query;

  const conditions: Prisma.TripWhereInput[] = [];

  // filter trips by minBudget and maxBudget
  if (minBudget && maxBudget) {
    conditions.push({
      budget: {
        gte: Number(minBudget),
        lte: Number(maxBudget),
      },
    });
  }

  if (minBudget) {
    conditions.push({
      budget: {
        gte: Number(minBudget),
      },
    });
  }

  if (maxBudget) {
    conditions.push({
      budget: {
        lte: Number(maxBudget),
      },
    });
  }

  // searchTerms
  if (searchTerm) {
    conditions.push({
      OR: [
        isNaN(parseInt(searchTerm as string))
          ? {
              destination: {
                contains: searchTerm,
                mode: "insensitive",
              },
            }
          : {
              budget: {
                equals: parseInt(searchTerm as string),
              },
            },
      ],
    });
  }

  // Filter trips by filterData
  if (Object.keys(filterData).length > 0) {
    Object.keys(filterData).forEach((key) => {
      conditions.push({
        [key as keyof typeof filterData]: {
          contains: filterData[key as keyof typeof filterData],
          mode: "insensitive",
        },
      });
    });
  }

  // calculate the skip values
  const skip = (Number(page) - 1) * Number(limit);

  console.log();

  const whereConditions: Prisma.TripWhereInput = { AND: conditions };

  console.dir({ query, conditions, whereConditions }, { depth: Infinity });

  const result = await prisma.trip.findMany({
    where: whereConditions,
    orderBy: {
      [sortBy as string]: sortOrder,
    },
    take: Number(limit),
    skip,
  });

  const total = await prisma.trip.count({
    where: whereConditions,
  });

  return {
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
    },
    data: result,
  };
};

// send travel buddy request
const travelBuddyRequest = async (tripId: string, userId: string) => {
  await prisma.user.findUniqueOrThrow({
    where: {
      id: userId,
    },
  });

  await prisma.trip.findUniqueOrThrow({
    where: {
      id: tripId,
    },
  });

  const requestedTravelBuddy = await prisma.travelBuddy.create({
    data: {
      tripId,
      userId,
    },
  });

  return requestedTravelBuddy;
};

// get single trip by id
const getTripById = async (id: string) => {
  return await prisma.trip.findUnique({
    where: {
      id,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });
};

// export the trip service
export const TripService = {
  createTripIntoDB,
  getTripById,
  getPaginatedAndFilteredTrips,
  travelBuddyRequest,
};
