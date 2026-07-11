import { ConnectionsPage } from "@/features/profile/ConnectionsPage";

export default async function Page({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  return <ConnectionsPage mode="following" username={decodeURIComponent(username)} />;
}
