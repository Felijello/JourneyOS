export type ProfileVisibility = "private" | "public";

export type Profile = {
  id: string;
  username: string;
  displayName: string;
  avatarPath?: string | null;
  avatarUrl?: string | null;
  bio: string;
  homeLocation: string;
  favoriteDestinations: string[];
  profileVisibility: ProfileVisibility;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ProfileInput = Pick<
  Profile,
  | "username"
  | "displayName"
  | "avatarUrl"
  | "bio"
  | "homeLocation"
  | "favoriteDestinations"
  | "profileVisibility"
>;

export type Follow = {
  followerId: string;
  followingId: string;
  createdAt: string;
};

export type UserSettings = {
  userId: string;
  emailNotifications: boolean;
  socialNotifications: boolean;
  tripReminders: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TripPublication = {
  tripId: string;
  userId: string;
  title: string;
  destinationName: string;
  destinationCity?: string | null;
  destinationRegion?: string | null;
  destinationCountryName?: string | null;
  destinationCountryCode?: string | null;
  destinationLatitude?: number | null;
  destinationLongitude?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  description: string;
  highlights: string[];
  coverPhotoUrl?: string | null;
  coverStoragePath?: string | null;
  coverPositionX: number;
  coverPositionY: number;
  coverZoom: number;
  countries: TripCountry[];
  createdAt: string;
  updatedAt: string;
};

export type TripLike = {
  userId: string;
  tripId: string;
  createdAt: string;
};

export type TripGalleryPhoto = {
  id: string;
  userId: string;
  tripId: string;
  storagePath: string;
  signedUrl?: string | null;
  caption: string;
  position: number;
  createdAt: string;
  updatedAt: string;
};
import type { TripCountry } from "@/types/country";
