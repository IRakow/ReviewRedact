import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import NewResellerForm from "./NewResellerForm"

export default async function NewResellerPage() {
  const session = await getSession()
  if (!session || session.user_type !== "owner") redirect("/")

  return <NewResellerForm />
}
