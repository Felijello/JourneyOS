export type CountryStatus =
  | "visited"
  | "planned"
  | "must_visit"
  | "maybe"
  | "no_interest";

export type CountryVisibility = "private" | "family" | "public";

export type Continent =
  | "Africa"
  | "Antarctica"
  | "Asia"
  | "Europe"
  | "North America"
  | "Oceania"
  | "South America";

export type Country = {
  id: string;
  userId?: string | null;
  name: string;
  continent: Continent;
  status: CountryStatus;
  personalRating: number;
  shortNote: string;
  longNote: string;
  bestTravelMonths: string;
  visibility: CountryVisibility;
  latitude?: number | null;
  longitude?: number | null;
  createdAt: string;
  updatedAt: string;
};

export type CountryFormInput = Omit<
  Country,
  "id" | "userId" | "createdAt" | "updatedAt"
>;

export type CountrySort = "newest" | "name" | "rating";

