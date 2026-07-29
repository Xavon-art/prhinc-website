const TURSO_DB_URL = 'https://prhinc-website-xavon-art.aws-ap-south-1.turso.io/v2/pipeline';
const TURSO_DB_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODUyODcyNTIsImlkIjoiMDE5ZmFiNjktNGYwMS03NmJjLThmNWMtMWZjNzIwNzc2YTNiIiwia2lkIjoiVUdzR211TUFnNW1qNHYxaTZmWGtCNENFSUc2Tjc4TXlTRUprUC16T3E3QSIsInJpZCI6IjM3OGUxODI4LWQ2MmEtNDRhYi1hMDgwLTI3MGI4MjU1NzhkOCJ9.w6OdV49GHpjKdpIQGw2bu9eAgGxSt04Jw7bmfkDrB4q1YOmJsXnfTDun6vvuWQkHAQF-NoC1VSh2t6uIvWbGDQ';

async function tursoQuery(sql, args = []) {
    const response = await fetch(TURSO_DB_URL, {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + TURSO_DB_TOKEN,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            requests: [{
                type: 'execute',
                stmt: { sql, args }
            }]
        })
    });
    const data = await response.json();
    if (data.results && data.results[0].type === 'ok') {
        return data.results[0].response.result;
    }
    throw new Error('Turso query failed: ' + JSON.stringify(data));
}

async function tursoExecute(sql, args = []) {
    const result = await tursoQuery(sql, args);
    return result.affected_row_count;
}

async function tursoSelect(sql, args = []) {
    const result = await tursoQuery(sql, args);
    const cols = result.cols.map(c => c.name);
    return result.rows.map(row => {
        const obj = {};
        row.forEach((val, i) => { obj[cols[i]] = val; });
        return obj;
    });
}

async function tursoInsert(sql, args = []) {
    const result = await tursoQuery(sql, args);
    return result.last_insert_rowid;
}

async function tursoBatch(requests) {
    const response = await fetch(TURSO_DB_URL, {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + TURSO_DB_TOKEN,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ requests })
    });
    const data = await response.json();
    if (data.results) {
        return data.results.map(r => {
            if (r.type === 'ok') return r.response.result;
            throw new Error('Turso batch failed: ' + JSON.stringify(r));
        });
    }
    throw new Error('Turso batch failed: ' + JSON.stringify(data));
}