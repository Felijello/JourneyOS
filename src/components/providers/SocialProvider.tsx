"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useTravel } from "@/components/providers/CountryProvider";
import { supabase } from "@/lib/supabase/client";
import type {
  Follow,
  Profile,
  ProfileInput,
  TripGalleryPhoto,
  TripLike,
  TripPublication,
  UserSettings,
} from "@/types/social";

type SocialContextValue = {
  currentProfile: Profile | null;
  profiles: Profile[];
  follows: Follow[];
  publications: TripPublication[];
  likes: TripLike[];
  travelPhotos: TripGalleryPhoto[];
  settings: UserSettings | null;
  isLoading: boolean;
  isAdmin: boolean;
  error: string | null;
  refreshSocial: () => Promise<void>;
  saveProfile: (input: ProfileInput, completeOnboarding?: boolean) => Promise<Profile>;
  uploadAvatar: (file: File) => Promise<void>;
  followProfile: (profileId: string) => Promise<void>;
  unfollowProfile: (profileId: string) => Promise<void>;
  toggleTripLike: (tripId: string) => Promise<void>;
  updateSettings: (input: Partial<UserSettings>) => Promise<void>;
  uploadTripPhotos: (tripId: string, files: File[]) => Promise<void>;
  deleteTripPhoto: (photo: TripGalleryPhoto) => Promise<void>;
  replaceTripPhoto: (photo: TripGalleryPhoto, file: File) => Promise<void>;
  setTripPhotoAsCover: (photo: TripGalleryPhoto) => Promise<void>;
};

type ProfileRow = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  home_location: string | null;
  favorite_destinations: string[] | null;
  profile_visibility: Profile["profileVisibility"];
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
};

type SettingsRow = {
  user_id: string;
  email_notifications: boolean;
  social_notifications: boolean;
  trip_reminders: boolean;
  created_at: string;
  updated_at: string;
};

type PublicationRow = {
  trip_id: string;
  user_id: string;
  title: string;
  destination_name: string;
  destination_city: string | null;
  destination_region: string | null;
  destination_country_name: string | null;
  destination_country_code: string | null;
  destination_latitude: number | null;
  destination_longitude: number | null;
  start_date: string | null;
  end_date: string | null;
  description: string;
  highlights: string[] | null;
  cover_photo_url: string | null;
  cover_storage_path: string | null;
  cover_position_x: number | null;
  cover_position_y: number | null;
  cover_zoom: number | null;
  countries: Array<{
    countryCode: string;
    countryName: string;
    continent: TripPublication["countries"][number]["continent"];
    latitude?: number | null;
    longitude?: number | null;
  }> | null;
  created_at: string;
  updated_at: string;
};

type GalleryPhotoRow = {
  id: string;
  user_id: string;
  trip_id: string;
  storage_path: string;
  caption: string;
  position: number;
  is_cover?: boolean;
  created_at: string;
  updated_at: string;
};

const SocialContext = createContext<SocialContextValue | null>(null);

const imageTypes = ["image/jpeg", "image/png", "image/webp"];
const maxAvatarSize = 4 * 1024 * 1024;
const maxTripPhotoSize = 6 * 1024 * 1024;

const demoProfiles: Profile[] = [
  {
    id: "demo-user",
    username: "felixtravels",
    displayName: "Felix",
    avatarPath: null,
    avatarUrl: null,
    bio: "Spontane Städtereisen, gute Aussicht und viel zu viele gespeicherte Orte.",
    homeLocation: "Wien",
    favoriteDestinations: ["Japan", "Portugal", "Island"],
    profileVisibility: "public",
    onboardingCompleted: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
  },
  {
    id: "demo-lena",
    username: "lenaspassport",
    displayName: "Lena",
    avatarPath: null,
    avatarUrl: null,
    bio: "Meer, kleine Cafés und Reisen mit leichtem Gepäck.",
    homeLocation: "Graz",
    favoriteDestinations: ["Griechenland", "Italien"],
    profileVisibility: "public",
    onboardingCompleted: true,
    createdAt: "2026-02-01T00:00:00.000Z",
    updatedAt: "2026-07-02T00:00:00.000Z",
  },
];

const demoPublications: TripPublication[] = [
  {
    tripId: "demo-trip-1",
    userId: "demo-lena",
    title: "Inselhüpfen in Griechenland",
    destinationName: "Kykladen, Griechenland",
    destinationCity: "Kykladen",
    destinationRegion: "Südliche Ägäis",
    destinationCountryName: "Griechenland",
    destinationCountryCode: "GR",
    destinationLatitude: 37.0,
    destinationLongitude: 25.3,
    startDate: "2026-08-18",
    endDate: "2026-08-29",
    description: "Elf Tage zwischen weißen Dörfern, ruhigen Buchten und richtig gutem Essen.",
    highlights: ["Naxos", "Paros", "Sonnenuntergang in Oia"],
    coverPhotoUrl:
      "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=82",
    coverStoragePath: null,
    coverPositionX: 50,
    coverPositionY: 50,
    coverZoom: 1,
    countries: [
      {
        countryCode: "GR",
        countryName: "Griechenland",
        continent: "Europe",
        latitude: 39.0742,
        longitude: 21.8243,
        source: "destination",
      },
    ],
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-07-02T00:00:00.000Z",
  },
];

function mapProfile(row: ProfileRow, signedAvatarUrl?: string | null): Profile {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name ?? row.username,
    avatarPath: row.avatar_url,
    avatarUrl: signedAvatarUrl ?? null,
    bio: row.bio ?? "",
    homeLocation: row.home_location ?? "",
    favoriteDestinations: row.favorite_destinations ?? [],
    profileVisibility: row.profile_visibility,
    onboardingCompleted: row.onboarding_completed,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSettings(row: SettingsRow): UserSettings {
  return {
    userId: row.user_id,
    emailNotifications: row.email_notifications,
    socialNotifications: row.social_notifications,
    tripReminders: row.trip_reminders,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapPublication(row: PublicationRow, signedCoverUrl?: string | null): TripPublication {
  return {
    tripId: row.trip_id,
    userId: row.user_id,
    title: row.title,
    destinationName: row.destination_name,
    destinationCity: row.destination_city,
    destinationRegion: row.destination_region,
    destinationCountryName: row.destination_country_name,
    destinationCountryCode: row.destination_country_code,
    destinationLatitude: row.destination_latitude,
    destinationLongitude: row.destination_longitude,
    startDate: row.start_date,
    endDate: row.end_date,
    description: row.description,
    highlights: row.highlights ?? [],
    coverPhotoUrl: signedCoverUrl ?? row.cover_photo_url,
    coverStoragePath: row.cover_storage_path,
    coverPositionX: row.cover_position_x ?? 50,
    coverPositionY: row.cover_position_y ?? 50,
    coverZoom: row.cover_zoom ?? 1,
    countries: (row.countries ?? []).map((country) => ({
      ...country,
      source: "destination" as const,
    })),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function validateImage(file: File, maxSize: number) {
  if (!imageTypes.includes(file.type)) {
    throw new Error("Bitte verwende ein JPEG-, PNG- oder WebP-Bild.");
  }
  if (file.size > maxSize) {
    throw new Error(`Das Bild darf maximal ${Math.round(maxSize / 1024 / 1024)} MB groß sein.`);
  }
}

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-");
}

export function SocialProvider({ children }: { children: ReactNode }) {
  const { isDemoMode, supabaseStatus, trips, refreshCountries } = useTravel();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [follows, setFollows] = useState<Follow[]>([]);
  const [publications, setPublications] = useState<TripPublication[]>([]);
  const [likes, setLikes] = useState<TripLike[]>([]);
  const [travelPhotos, setTravelPhotos] = useState<TripGalleryPhoto[]>([]);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshSocial = useCallback(async () => {
    if (isDemoMode || !supabase || !supabaseStatus.authenticated) {
      const localPublications: TripPublication[] = isDemoMode
        ? trips
            .filter(
              (trip) => trip.visibility === "public" && trip.status === "completed",
            )
            .map((trip) => ({
              tripId: trip.id,
              userId: "demo-user",
              title: trip.title,
              destinationName: trip.destinationName,
              destinationCity: trip.destinationCity,
              destinationRegion: trip.destinationRegion,
              destinationCountryName: trip.destinationCountryName,
              destinationCountryCode: trip.destinationCountryCode,
              destinationLatitude: trip.destinationLatitude,
              destinationLongitude: trip.destinationLongitude,
              startDate: trip.startDate,
              endDate: trip.endDate,
              description: trip.description,
              highlights: trip.highlights,
              coverPhotoUrl: trip.coverPhotoUrl,
              coverStoragePath: trip.coverStoragePath,
              coverPositionX: trip.coverPositionX,
              coverPositionY: trip.coverPositionY,
              coverZoom: trip.coverZoom,
              countries: trip.countries,
              createdAt: trip.createdAt,
              updatedAt: trip.updatedAt,
            }))
        : [];
      setProfiles(demoProfiles);
      setCurrentProfile(isDemoMode ? demoProfiles[0] : null);
      setPublications(isDemoMode ? [...localPublications, ...demoPublications] : []);
      setFollows(isDemoMode ? [{ followerId: "demo-user", followingId: "demo-lena", createdAt: "2026-07-02T00:00:00.000Z" }] : []);
      setLikes([]);
      setTravelPhotos([]);
      setSettings(null);
      setIsAdmin(false);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    const client = supabase;

    const { data: userData, error: userError } = await client.auth.getUser();
    if (userError || !userData.user) {
      setError("Dein Profil konnte gerade nicht geladen werden.");
      setIsLoading(false);
      return;
    }

    setIsAdmin(userData.user.app_metadata?.role === "admin");

    const [profilesResult, settingsResult, followsResult, publicationsResult, likesResult, photosResult] =
      await Promise.all([
        client.from("profiles").select("*").order("username"),
        client.from("user_settings").select("*").eq("user_id", userData.user.id).maybeSingle(),
        client.from("follows").select("*").order("created_at", { ascending: false }),
        client.from("trip_publications").select("*").order("updated_at", { ascending: false }),
        client.from("trip_likes").select("*").order("created_at", { ascending: false }),
        client.from("travel_photos").select("*").order("position"),
      ]);

    const requestError =
      profilesResult.error ?? settingsResult.error ?? followsResult.error ??
      publicationsResult.error ?? likesResult.error ?? photosResult.error;

    if (requestError) {
      setError(`Community-Daten konnten nicht geladen werden: ${requestError.message}`);
      setIsLoading(false);
      return;
    }

    const profileRows = (profilesResult.data ?? []) as ProfileRow[];
    const avatarResults = await Promise.all(
      profileRows.map(async (row) => {
        if (!row.avatar_url) return null;
        const { data } = await client.storage
          .from("profile-images")
          .createSignedUrl(row.avatar_url, 60 * 60);
        return data?.signedUrl ?? null;
      }),
    );
    const mappedProfiles = profileRows.map((row, index) => mapProfile(row, avatarResults[index]));

    const photoRows = (photosResult.data ?? []) as GalleryPhotoRow[];
    const photoUrls = await Promise.all(
      photoRows.map(async (row) => {
        const { data } = await client.storage
          .from("travel-photos")
          .createSignedUrl(row.storage_path, 60 * 60);
        return data?.signedUrl ?? null;
      }),
    );
    const publicationRows = (publicationsResult.data ?? []) as PublicationRow[];
    const publicationCoverUrls = await Promise.all(
      publicationRows.map(async (row) => {
        if (!row.cover_storage_path) return null;
        const { data } = await client.storage
          .from("travel-photos")
          .createSignedUrl(row.cover_storage_path, 60 * 60);
        return data?.signedUrl ?? null;
      }),
    );

    setProfiles(mappedProfiles);
    setCurrentProfile(mappedProfiles.find((profile) => profile.id === userData.user.id) ?? null);
    setSettings(settingsResult.data ? mapSettings(settingsResult.data as SettingsRow) : null);
    setFollows(
      (followsResult.data ?? []).map((row) => ({
        followerId: row.follower_id,
        followingId: row.following_id,
        createdAt: row.created_at,
      })),
    );
    setPublications(
      publicationRows.map((row, index) =>
        mapPublication(row, publicationCoverUrls[index]),
      ),
    );
    setLikes(
      (likesResult.data ?? []).map((row) => ({
        userId: row.user_id,
        tripId: row.trip_id,
        createdAt: row.created_at,
      })),
    );
    setTravelPhotos(
      photoRows.map((row, index) => ({
        id: row.id,
        userId: row.user_id,
        tripId: row.trip_id,
        storagePath: row.storage_path,
        signedUrl: photoUrls[index],
        caption: row.caption,
        position: row.position,
        isCover: row.is_cover ?? false,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
    );
    setIsLoading(false);
  }, [isDemoMode, supabaseStatus.authenticated, trips]);

  useEffect(() => {
    const timer = window.setTimeout(() => void refreshSocial(), 0);
    return () => window.clearTimeout(timer);
  }, [refreshSocial]);

  const saveProfile = useCallback(
    async (input: ProfileInput, completeOnboarding = false) => {
      const username = input.username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
      const favoriteDestinations = input.favoriteDestinations
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 8);
      if (!/^[a-z0-9_]{3,24}$/.test(username)) {
        throw new Error("Der Username braucht 3 bis 24 Zeichen: Buchstaben, Zahlen oder _. ");
      }

      if (isDemoMode || !supabase) {
        const next: Profile = {
          ...(currentProfile ?? demoProfiles[0]),
          ...input,
          username,
          favoriteDestinations,
          onboardingCompleted: completeOnboarding || currentProfile?.onboardingCompleted || false,
          updatedAt: new Date().toISOString(),
        };
        setCurrentProfile(next);
        setProfiles((items) => items.map((item) => (item.id === next.id ? next : item)));
        return next;
      }

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Bitte melde dich erneut an.");

      const { data, error: updateError } = await supabase
        .from("profiles")
        .update({
          username,
          display_name: input.displayName.trim(),
          bio: input.bio.trim(),
          home_location: input.homeLocation.trim(),
          favorite_destinations: favoriteDestinations,
          profile_visibility: input.profileVisibility,
          onboarding_completed: completeOnboarding || currentProfile?.onboardingCompleted || false,
        })
        .eq("id", userData.user.id)
        .select("*")
        .single();

      if (updateError) {
        if (updateError.code === "23505") throw new Error("Dieser Username ist schon vergeben.");
        throw new Error(updateError.message);
      }

      await refreshSocial();
      return mapProfile(data as ProfileRow, currentProfile?.avatarUrl);
    },
    [currentProfile, isDemoMode, refreshSocial],
  );

  const uploadAvatar = useCallback(
    async (file: File) => {
      validateImage(file, maxAvatarSize);
      if (isDemoMode) {
        const avatarUrl = URL.createObjectURL(file);
        setCurrentProfile((profile) => (profile ? { ...profile, avatarUrl } : profile));
        setProfiles((items) => items.map((profile) =>
          profile.id === currentProfile?.id ? { ...profile, avatarUrl } : profile,
        ));
        return;
      }
      if (!supabase) throw new Error("Profilbilder brauchen ein echtes Konto.");
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Bitte melde dich erneut an.");

      const path = `${userData.user.id}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
      const { error: uploadError } = await supabase.storage
        .from("profile-images")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) throw new Error(uploadError.message);

      const oldPath = currentProfile?.avatarPath;
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ avatar_url: path })
        .eq("id", userData.user.id);
      if (profileError) {
        await supabase.storage.from("profile-images").remove([path]);
        throw new Error(profileError.message);
      }
      if (oldPath) await supabase.storage.from("profile-images").remove([oldPath]);
      await refreshSocial();
    },
    [currentProfile?.avatarPath, currentProfile?.id, isDemoMode, refreshSocial],
  );

  const followProfile = useCallback(async (profileId: string) => {
    if (isDemoMode) {
      setFollows((items) => [...items, { followerId: "demo-user", followingId: profileId, createdAt: new Date().toISOString() }]);
      return;
    }
    if (!supabase) return;
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw new Error("Bitte melde dich erneut an.");
    const { error: requestError } = await supabase
      .from("follows")
      .insert({ follower_id: data.user.id, following_id: profileId });
    if (requestError && requestError.code !== "23505") throw new Error(requestError.message);
    await refreshSocial();
  }, [isDemoMode, refreshSocial]);

  const unfollowProfile = useCallback(async (profileId: string) => {
    if (isDemoMode) {
      setFollows((items) => items.filter((item) => !(item.followerId === "demo-user" && item.followingId === profileId)));
      return;
    }
    if (!supabase) return;
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw new Error("Bitte melde dich erneut an.");
    const { error: requestError } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", data.user.id)
      .eq("following_id", profileId);
    if (requestError) throw new Error(requestError.message);
    await refreshSocial();
  }, [isDemoMode, refreshSocial]);

  const toggleTripLike = useCallback(async (tripId: string) => {
    const userId = currentProfile?.id;
    if (!userId) throw new Error("Bitte melde dich an, um Reisen zu liken.");
    const existing = likes.some((like) => like.userId === userId && like.tripId === tripId);
    if (isDemoMode) {
      setLikes((items) =>
        existing
          ? items.filter((like) => !(like.userId === userId && like.tripId === tripId))
          : [...items, { userId, tripId, createdAt: new Date().toISOString() }],
      );
      return;
    }
    if (!supabase) return;
    const request = existing
      ? supabase.from("trip_likes").delete().eq("user_id", userId).eq("trip_id", tripId)
      : supabase.from("trip_likes").insert({ user_id: userId, trip_id: tripId });
    const { error: requestError } = await request;
    if (requestError) throw new Error(requestError.message);
    await refreshSocial();
  }, [currentProfile?.id, isDemoMode, likes, refreshSocial]);

  const updateSettings = useCallback(async (input: Partial<UserSettings>) => {
    if (isDemoMode) {
      setSettings((current) => (current ? { ...current, ...input } : null));
      return;
    }
    if (!supabase || !currentProfile) return;
    const { error: requestError } = await supabase
      .from("user_settings")
      .update({
        email_notifications: input.emailNotifications,
        social_notifications: input.socialNotifications,
        trip_reminders: input.tripReminders,
      })
      .eq("user_id", currentProfile.id);
    if (requestError) throw new Error(requestError.message);
    await refreshSocial();
  }, [currentProfile, isDemoMode, refreshSocial]);

  const uploadTripPhotos = useCallback(async (tripId: string, files: File[]) => {
    const existing = travelPhotos.filter((photo) => photo.tripId === tripId);
    if (existing.length + files.length > 12) throw new Error("Pro Reise sind maximal 12 Fotos möglich.");
    if (isDemoMode) {
      const used = new Set(existing.map((photo) => photo.position));
      const now = new Date().toISOString();
      const additions = files.map((file) => {
        validateImage(file, maxTripPhotoSize);
        const position = Array.from({ length: 12 }, (_, index) => index).find((index) => !used.has(index));
        if (position === undefined) throw new Error("Die Galerie ist bereits voll.");
        used.add(position);
        return {
          id: crypto.randomUUID(),
          userId: "demo-user",
          tripId,
          storagePath: `demo/${file.name}`,
          signedUrl: URL.createObjectURL(file),
          caption: file.name,
          position,
          isCover: false,
          createdAt: now,
          updatedAt: now,
        } satisfies TripGalleryPhoto;
      });
      setTravelPhotos((items) => [...items, ...additions]);
      return;
    }
    if (!supabase) throw new Error("Foto-Uploads brauchen ein echtes Konto.");
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw new Error("Bitte melde dich erneut an.");
    const used = new Set(existing.map((photo) => photo.position));

    for (const file of files) {
      validateImage(file, maxTripPhotoSize);
      const position = Array.from({ length: 12 }, (_, index) => index).find((index) => !used.has(index));
      if (position === undefined) throw new Error("Die Galerie ist bereits voll.");
      used.add(position);
      const path = `${data.user.id}/trips/${tripId}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
      const { error: uploadError } = await supabase.storage
        .from("travel-photos")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) throw new Error(uploadError.message);
      const { error: rowError } = await supabase.from("travel_photos").insert({
        user_id: data.user.id,
        trip_id: tripId,
        storage_path: path,
        caption: file.name,
        position,
      });
      if (rowError) {
        await supabase.storage.from("travel-photos").remove([path]);
        throw new Error(rowError.message);
      }
    }
    await refreshSocial();
  }, [isDemoMode, refreshSocial, travelPhotos]);

  const deleteTripPhoto = useCallback(async (photo: TripGalleryPhoto) => {
    if (isDemoMode) {
      setTravelPhotos((items) => items.filter((item) => item.id !== photo.id));
      return;
    }
    if (!supabase) return;
    const { error: rowError } = await supabase.from("travel_photos").delete().eq("id", photo.id);
    if (rowError) throw new Error(rowError.message);
    await supabase.storage.from("travel-photos").remove([photo.storagePath]);
    await refreshSocial();
  }, [isDemoMode, refreshSocial]);

  const replaceTripPhoto = useCallback(async (photo: TripGalleryPhoto, file: File) => {
    validateImage(file, maxTripPhotoSize);
    if (isDemoMode) {
      const signedUrl = URL.createObjectURL(file);
      setTravelPhotos((items) => items.map((item) =>
        item.id === photo.id
          ? { ...item, signedUrl, caption: file.name, updatedAt: new Date().toISOString() }
          : item,
      ));
      return;
    }
    if (!supabase) return;
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw new Error("Bitte melde dich erneut an.");
    const path = `${data.user.id}/trips/${photo.tripId}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
    const { error: uploadError } = await supabase.storage
      .from("travel-photos")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (uploadError) throw new Error(uploadError.message);
    const { error: rowError } = await supabase
      .from("travel_photos")
      .update({ storage_path: path, caption: file.name })
      .eq("id", photo.id);
    if (rowError) {
      await supabase.storage.from("travel-photos").remove([path]);
      throw new Error(rowError.message);
    }
    await supabase.storage.from("travel-photos").remove([photo.storagePath]);
    await refreshSocial();
  }, [isDemoMode, refreshSocial]);

  const setTripPhotoAsCover = useCallback(async (photo: TripGalleryPhoto) => {
    if (isDemoMode) {
      setTravelPhotos((items) => items.map((item) => ({ ...item, isCover: item.id === photo.id })));
      return;
    }
    if (!supabase) return;
    const { data } = await supabase.auth.getUser();
    if (!data.user || data.user.id !== photo.userId) throw new Error("Du kannst nur eigene Fotos als Cover verwenden.");
    const { error: clearError } = await supabase.from("travel_photos").update({ is_cover: false }).eq("trip_id", photo.tripId);
    if (clearError) throw new Error(clearError.message);
    const { error: coverError } = await supabase.from("travel_photos").update({ is_cover: true }).eq("id", photo.id);
    if (coverError) throw new Error(coverError.message);
    const { error: tripError } = await supabase.from("trips").update({ cover_storage_path: photo.storagePath, cover_photo_url: null }).eq("id", photo.tripId);
    if (tripError) throw new Error(tripError.message);
    await Promise.all([refreshSocial(), refreshCountries()]);
  }, [isDemoMode, refreshCountries, refreshSocial]);

  const value = useMemo<SocialContextValue>(() => ({
    currentProfile,
    profiles,
    follows,
    publications,
    likes,
    travelPhotos,
    settings,
    isLoading,
    isAdmin,
    error,
    refreshSocial,
    saveProfile,
    uploadAvatar,
    followProfile,
    unfollowProfile,
    toggleTripLike,
    updateSettings,
    uploadTripPhotos,
    deleteTripPhoto,
    replaceTripPhoto,
    setTripPhotoAsCover,
  }), [
    currentProfile, profiles, follows, publications, likes, travelPhotos, settings,
    isLoading, isAdmin, error, refreshSocial, saveProfile, uploadAvatar,
    followProfile, unfollowProfile, toggleTripLike, updateSettings,
    uploadTripPhotos, deleteTripPhoto, replaceTripPhoto, setTripPhotoAsCover,
  ]);

  return <SocialContext.Provider value={value}>{children}</SocialContext.Provider>;
}

export function useSocial() {
  const context = useContext(SocialContext);
  if (!context) throw new Error("useSocial must be used within SocialProvider");
  return context;
}
