const TURSO_URL = 'https://prhinc-website-xavon-art.aws-ap-south-1.turso.io/v2/pipeline';
const TURSO_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODUzNzY2MjcsImlkIjoiMDE5ZmFiNjktNGYwMS03NmJjLThmNWMtMWZjNzIwNzc2YTNiIiwia2lkIjoiVUdzR211TUFnNW1qNHYxaTZmWGtCNENFSUc2Tjc4TXlTRUprUC16T3E3QSIsInJpZCI6IjM3OGUxODI4LWQ2MmEtNDRhYi1hMDgwLTI3MGI4MjU1NzhkOCJ9.zMRfYnHi4bZIm2Xrdj0jQnbESv5agIMp71-N39-9szZGo9qwlnZ_jvh-fOiC2FUg0GoQMy7RmKHhwuL0_YqmBA';

export function tursoArg(value) {
  if (value === null || value === undefined) return { type: 'null' };
  if (typeof value === 'number') return Number.isInteger(value) ? { type: 'integer', value: String(value) } : { type: 'real', value: String(value) };
  return { type: 'text', value: String(value) };
}

export async function tursoQuery(sql, args = []) {
  const resp = await fetch(TURSO_URL, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + TURSO_TOKEN,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      requests: [{ type: 'execute', stmt: { sql, args: args.map(tursoArg) } }]
    })
  });
  const data = await resp.json();
  if (data.results && data.results[0].type === 'ok') {
    return data.results[0].response.result;
  }
  throw new Error('Turso query failed: ' + JSON.stringify(data));
}

export async function tursoSelect(sql, args = []) {
  const result = await tursoQuery(sql, args);
  const cols = result.cols.map(c => c.name);
  return result.rows.map(row => {
    const obj = {};
    row.forEach((val, i) => { obj[cols[i]] = val; });
    return obj;
  });
}

export async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}
