"use server"

// SRS UC Trace - M05 Mang luoi:
// UC-35 Goi y ket noi; UC-36 Gui/huy loi moi; UC-37 Phan hoi loi moi; UC-38 Huy ket noi.
// UC-39 Theo doi/bo theo doi nguoi dung; UC-40 Chan/bo chan nguoi dung.
// Flow: /network|profile action buttons -> network action facade -> connection/follow/block actions -> services/repos/RPC.

import {
  blockUserAction as blockUser,
  getBlockStatusAction as getBlockStatus,
  listBlockedUsersAction as listBlockedUsers,
  unblockUserAction as unblockUser,
} from "./block-actions"
import {
  cancelConnectionRequestAction as cancelConnectionRequest,
  removeConnectionAction as removeConnection,
  respondConnectionRequestAction as respondConnectionRequest,
  sendConnectionRequestAction as sendConnectionRequest,
} from "./connection-actions"
import { toggleFollowUserAction as toggleFollowUser } from "./follow-actions"
import {
  getConnectionRelationAction as getConnectionRelation,
  getNetworkOverviewAction as getNetworkOverview,
} from "./read-actions"

export async function getNetworkOverviewAction() {
  return getNetworkOverview()
}

export async function getConnectionRelationAction(
  targetUserId: Parameters<typeof getConnectionRelation>[0],
) {
  return getConnectionRelation(targetUserId)
}

export async function toggleFollowUserAction(
  targetUserId: Parameters<typeof toggleFollowUser>[0],
) {
  return toggleFollowUser(targetUserId)
}

export async function sendConnectionRequestAction(
  targetUserId: Parameters<typeof sendConnectionRequest>[0],
) {
  return sendConnectionRequest(targetUserId)
}

export async function cancelConnectionRequestAction(
  connectionId: Parameters<typeof cancelConnectionRequest>[0],
) {
  return cancelConnectionRequest(connectionId)
}

export async function respondConnectionRequestAction(
  connectionId: Parameters<typeof respondConnectionRequest>[0],
  accept: Parameters<typeof respondConnectionRequest>[1],
) {
  return respondConnectionRequest(connectionId, accept)
}

export async function removeConnectionAction(
  connectionId: Parameters<typeof removeConnection>[0],
) {
  return removeConnection(connectionId)
}

export async function getBlockStatusAction(
  targetUserId: Parameters<typeof getBlockStatus>[0],
) {
  return getBlockStatus(targetUserId)
}

export async function listBlockedUsersAction() {
  return listBlockedUsers()
}

export async function blockUserAction(
  targetUserId: Parameters<typeof blockUser>[0],
) {
  return blockUser(targetUserId)
}

export async function unblockUserAction(
  targetUserId: Parameters<typeof unblockUser>[0],
) {
  return unblockUser(targetUserId)
}
