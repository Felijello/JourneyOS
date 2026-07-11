import { UserProfilePage } from "@/features/profile/UserProfilePage";

export default async function Page({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  return <UserProfilePage username={decodeURIComponent(username)} />;
}
