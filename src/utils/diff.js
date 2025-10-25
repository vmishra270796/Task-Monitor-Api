export function diffObjects(before, after) {
  // CREATE: only after
  if (!before && after) {
    const changes = {};
    for (const key of Object.keys(after)) {
      if (['_id','__v','createdAt','updatedAt'].includes(key)) continue;
      changes[key] = { before: null, after: after[key] };
    }
    return changes;
  }

  // DELETE: only before
  if (before && !after) {
    const changes = {};
    for (const key of Object.keys(before)) {
      if (['_id','__v','createdAt','updatedAt'].includes(key)) continue;
      changes[key] = { before: before[key], after: null };
    }
    return changes;
  }

  // UPDATE / MOVE: both before and after
  const changes = {};
  for (const key of Object.keys(after)) {
    if (['_id','__v','createdAt','updatedAt'].includes(key)) continue;
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
      changes[key] = { before: before[key], after: after[key] };
    }
  }
  return changes;
}
