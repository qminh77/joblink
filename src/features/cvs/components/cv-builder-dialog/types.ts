export type ProfileData = {
  fullName: string
  email: string
  phone: string | null
  headline: string | null
  experiences: {
    id: number
    companyName: string
    position: string
    startDate: string
    endDate: string | null
    isCurrent: boolean
    description: string | null
  }[]
  educations: {
    id: number
    schoolName: string
    degree: string | null
    fieldOfStudy: string | null
    startDate: string | null
    endDate: string | null
    description: string | null
  }[]
  skills: { id: number; name: string }[]
}
