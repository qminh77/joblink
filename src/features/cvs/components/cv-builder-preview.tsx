export type CvPreviewExperience = {
  id: number
  company_name: string
  position: string
  start_date: string
  end_date: string | null
  description: string | null
}

export type CvPreviewEducation = {
  id: number
  school_name: string
  degree: string | null
  field_of_study: string | null
  start_date: string | null
  end_date: string | null
  description: string | null
}

export type CvPreviewSkill = {
  id: number
  name: string
}

type Props = {
  fullName: string
  email: string
  phone?: string | null
  headline?: string | null
  experiences: CvPreviewExperience[]
  educations: CvPreviewEducation[]
  skills: CvPreviewSkill[]
}

function formatDate(d: string | null): string {
  if (!d) return "Present"
  const date = new Date(d)
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" })
}

export function CvBuilderPreview({
  fullName,
  email,
  phone,
  headline,
  experiences,
  educations,
  skills,
}: Props) {
  return (
    <div
      id="cv-builder-preview"
      className="w-[210mm] bg-white text-[#111827] px-14 py-16 font-sans leading-relaxed"
      style={{ minHeight: "297mm", boxSizing: "border-box" }}
    >
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight uppercase text-[#111827] mb-2">
          {fullName}
        </h1>
        {headline ? (
          <p className="text-lg text-[#4b5563] font-medium">{headline}</p>
        ) : null}
        <div className="flex flex-wrap justify-center items-center gap-x-3 gap-y-2 text-sm text-[#6b7280] mt-4">
          <span>{email}</span>
          {phone ? <span className="text-[#d1d5db]">•</span> : null}
          {phone ? <span>{phone}</span> : null}
        </div>
      </div>

      <div className="space-y-8">
        {/* Experiences */}
        {experiences.length > 0 ? (
          <div>
            <h2 className="text-lg font-bold uppercase tracking-widest text-[#111827] border-b-2 border-[#111827] pb-2 mb-5">
              Experience
            </h2>
            <div className="space-y-6">
              {experiences.map((exp) => (
                <div key={exp.id}>
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-base font-bold text-[#111827]">
                      {exp.position}
                    </h3>
                    <span className="text-sm font-semibold text-[#6b7280] ml-4 shrink-0">
                      {formatDate(exp.start_date)} – {formatDate(exp.end_date)}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-[#4b5563] mt-0.5 mb-2">
                    {exp.company_name}
                  </div>
                  {exp.description ? (
                    <p className="text-sm text-[#374151] leading-relaxed whitespace-pre-wrap break-words">
                      {exp.description}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Education */}
        {educations.length > 0 ? (
          <div>
            <h2 className="text-lg font-bold uppercase tracking-widest text-[#111827] border-b-2 border-[#111827] pb-2 mb-5">
              Education
            </h2>
            <div className="space-y-6">
              {educations.map((edu) => (
                <div key={edu.id}>
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-base font-bold text-[#111827]">
                      {edu.school_name}
                    </h3>
                    <span className="text-sm font-semibold text-[#6b7280] ml-4 shrink-0">
                      {formatDate(edu.start_date)} – {formatDate(edu.end_date)}
                    </span>
                  </div>
                  {edu.degree || edu.field_of_study ? (
                    <div className="text-sm font-semibold text-[#4b5563] mt-0.5 mb-2">
                      {[edu.degree, edu.field_of_study]
                        .filter(Boolean)
                        .join(" in ")}
                    </div>
                  ) : null}
                  {edu.description ? (
                    <p className="text-sm text-[#374151] leading-relaxed whitespace-pre-wrap break-words">
                      {edu.description}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Skills */}
        {skills.length > 0 ? (
          <div>
            <h2 className="text-lg font-bold uppercase tracking-widest text-[#111827] border-b-2 border-[#111827] pb-2 mb-5">
              Skills
            </h2>
            <div className="flex flex-wrap gap-2 text-sm text-[#374151] font-medium">
              {skills.map((s, idx) => (
                <span key={s.id} className="inline-flex items-center">
                  {s.name}
                  {idx < skills.length - 1 ? (
                    <span className="mx-2 text-[#d1d5db]">|</span>
                  ) : null}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
