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
      className="w-[210mm] bg-white text-black p-8 font-sans leading-relaxed"
      style={{ minHeight: "297mm" }}
    >
      {/* Header */}
      <div className="border-b border-gray-300 pb-4 mb-4">
        <h1 className="text-2xl font-bold tracking-tight">{fullName}</h1>
        {headline ? (
          <p className="text-sm text-gray-600 mt-0.5">{headline}</p>
        ) : null}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mt-2">
          <span>{email}</span>
          {phone ? <span>{phone}</span> : null}
        </div>
      </div>

      {/* Experiences */}
      {experiences.length > 0 ? (
        <div className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
            Experience
          </h2>
          {experiences.map((exp) => (
            <div key={exp.id} className="mb-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold">{exp.position}</p>
                  <p className="text-xs text-gray-600">{exp.company_name}</p>
                </div>
                <p className="text-xs text-gray-500 whitespace-nowrap ml-2">
                  {formatDate(exp.start_date)} – {formatDate(exp.end_date)}
                </p>
              </div>
              {exp.description ? (
                <p className="text-xs text-gray-700 mt-1 whitespace-pre-wrap break-words">
                  {exp.description}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {/* Education */}
      {educations.length > 0 ? (
        <div className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
            Education
          </h2>
          {educations.map((edu) => (
            <div key={edu.id} className="mb-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold">{edu.school_name}</p>
                  {edu.degree || edu.field_of_study ? (
                    <p className="text-xs text-gray-600">
                      {[edu.degree, edu.field_of_study].filter(Boolean).join(" in ")}
                    </p>
                  ) : null}
                </div>
                <p className="text-xs text-gray-500 whitespace-nowrap ml-2">
                  {formatDate(edu.start_date)} – {formatDate(edu.end_date)}
                </p>
              </div>
              {edu.description ? (
                <p className="text-xs text-gray-700 mt-1 whitespace-pre-wrap break-words">
                  {edu.description}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {/* Skills */}
      {skills.length > 0 ? (
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
            Skills
          </h2>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {skills.map((s) => (
              <span key={s.id} className="text-xs text-gray-700">
                {s.name}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
