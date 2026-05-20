import { loadNetworkOverview } from "@/features/network/api/queries"
import { NetworkTabs } from "./network-tabs"

export async function NetworkContent() {
  const { suggestions, connections, incoming, outgoing } =
    await loadNetworkOverview()

  return (
    <NetworkTabs
      suggestions={suggestions}
      connections={connections}
      incoming={incoming}
      outgoing={outgoing}
    />
  )
}
