import { redirect } from "next/navigation";

export default async function AssessmentRedirectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/assessment/${id}/results`);
}
