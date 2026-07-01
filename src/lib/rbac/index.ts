export {
  MODULES,
  MODULE_LABELS,
  type ModuleName,
} from "./modules"

export {
  ACTIONS,
  ACTION_LABELS,
  type ActionName,
} from "./actions"

export {
  PERMISSIONS,
  getAllPermissionNames,
  getPermissionsByModule,
  isValidPermissionName,
  type PermissionName,
  type PermissionKey,
} from "./permissions"

export {
  getPermissionsForRole,
  getUserPermissionsByUserId,
  roleHasPermission,
  checkUserPermission,
  checkUserAllPermissions,
  checkUserAnyPermission,
} from "./rbac"

export {
  requirePermission,
  requireAllPermissions,
  requireAnyPermission,
  hasPermission,
  isAdminUser,
} from "./rbac-guard"
