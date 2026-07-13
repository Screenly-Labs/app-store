// Compose one array-item object into a single string token per its manifest
// `x-format` template, e.g. "{zone}|{label}". Pure function, unit tested.
//
// A blank field drops itself *and* the separator that joins it to its
// neighbour, so a row with only a zone yields just the zone (no trailing `|`),
// and a row with only a label yields just the label (no leading `|`). Any
// leading/trailing literal is kept only when at least one field is present —
// enough for the composite tokens signage-app manifests use. See
// docs/app-manifest.md (`x-format`).
export function applyItemFormat(fmt, item = {}) {
  const re = /\{([^}]+)\}/g;
  const fields = []; // { sep, name } — sep is the literal text before this field
  let last = 0;
  let m;
  while ((m = re.exec(fmt))) {
    fields.push({ sep: fmt.slice(last, m.index), name: m[1] });
    last = re.lastIndex;
  }
  const tail = fmt.slice(last);
  // The literal before the first field is a prefix; the literal before every
  // later field is the separator that joins it to the previous one, and drops
  // out with either neighbour. Prefix and tail survive as long as any field does.
  const prefix = fields.length ? fields[0].sep : '';
  let out = '';
  let any = false;
  for (const { sep, name } of fields) {
    const raw = item[name];
    const value = raw === undefined || raw === null ? '' : String(raw).trim();
    if (!value) continue; // drop this field and its adjacent separator
    // The first emitted field takes no separator: field[0]'s sep is the prefix
    // (added below), and a later first-present field drops the separator to its
    // absent predecessor.
    out += (any ? sep : '') + value;
    any = true;
  }
  return any ? prefix + out + tail : '';
}
