export function toQuestJson(q) {
  return { id: q.id, title: q.title, type: q.type, durationMin: q.duration_min, subjectTag: q.subject_tag, status: q.status };
}
