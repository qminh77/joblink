import { loadNetworkOverview } from "@/features/network/api/queries"

import { NetworkTabs } from "./network-tabs"

export async function NetworkContent() {
  const overview = await loadNetworkOverview()
  return <NetworkTabs initialOverview={overview} />
}
