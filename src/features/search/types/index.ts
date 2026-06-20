export type SearchPerson = {
  userId: number
  name: string
  avatarUrl: string | null
  headline: string | null
}

export type SearchCompany = {
  userId: number
  name: string
  logoUrl: string | null
  industry: string | null
}

export type SearchJob = {
  id: number
  title: string
  companyName: string
}

export type GlobalSearchResults = {
  people: SearchPerson[]
  companies: SearchCompany[]
  jobs: SearchJob[]
}

export type SearchPagePerson = SearchPerson & {
  role: "member" | "admin"
  location: string | null
  connectionStatus: "none" | "connected" | "pending"
}

export type SearchPageCompany = SearchCompany & {
  verified: boolean
  description: string | null
}

export type SearchPageJob = {
  id: number
  title: string
  salaryMin: number | null
  salaryMax: number | null
  salaryVisible: boolean
  createdAt: string
  companyUserId: number
  companyName: string
  companyLogoUrl: string | null
  companyVerified: boolean
  provinceName: string | null
  jobTypeName: string | null
  workModeName: string | null
  viewerSaved: boolean
}

export type SearchPagePost = {
  id: number
  authorId: number
  content: string
  postType: string
  createdAt: string
  authorName: string
  authorAvatarUrl: string | null
  authorRole: string
  reactionCount: number
  commentCount: number
}

export type SearchPeopleResult = { items: SearchPagePerson[]; total: number }
export type SearchCompaniesResult = { items: SearchPageCompany[]; total: number }
export type SearchJobsResult = { items: SearchPageJob[]; total: number }
export type SearchPostsResult = { items: SearchPagePost[]; total: number }

export type SearchTab = "all" | "people" | "companies" | "jobs" | "posts"

export type SearchPageResults = {
  query: string
  activeTab: SearchTab
  people: SearchPeopleResult
  companies: SearchCompaniesResult
  jobs: SearchJobsResult
  posts: SearchPostsResult
}

export type SearchFilters = {
  peopleLocation: string | null
  companyIndustry: string | null
  jobProvinceId: number | null
  jobTypeIds: number[] | null
  workModeIds: number[] | null
  salaryMin: number | null
}
