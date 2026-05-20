import { requireCurrentUser } from "@/features/auth/api/auth-server"
import {
  loadConnections,
  loadInvitations,
  loadSuggestions,
} from "@/features/network/api/queries"
import { NetworkTabs } from "@/features/network/components/network-tabs"

export default async function NetworkPage() {
  await requireCurrentUser()

  const [suggestions, connections, invitations] = await Promise.all([
    loadSuggestions(),
    loadConnections(),
    loadInvitations(),
  ])

  return (
    <NetworkTabs
      suggestions={suggestions}
      connections={connections}
      incoming={invitations.incoming}
      outgoing={invitations.outgoing}
    />
  )
}
