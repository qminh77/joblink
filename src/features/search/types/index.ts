// Tìm kiếm diện rộng trên header: gộp người dùng, công ty, việc làm.
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
