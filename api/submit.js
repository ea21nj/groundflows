export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { firstName, lastName, email, company, trade } = req.body;
  const name = `${firstName || ''} ${lastName || ''}`.trim() || 'New Lead';
  const token = process.env.MONDAY_API_TOKEN;
  const boardId = 18393588025;

  try {
    // Create the item
    const createRes = await fetch('https://api.monday.com/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token,
        'API-Version': '2024-01'
      },
      body: JSON.stringify({
        query: `mutation {
          create_item(
            board_id: ${boardId},
            item_name: "${name.replace(/"/g, '\\"')}"
          ) { id }
        }`
      })
    });

    const createData = await createRes.json();
    const itemId = createData?.data?.create_item?.id;

    if (!itemId) {
      console.error('monday.com create_item error:', JSON.stringify(createData));
      return res.status(500).json({ error: 'Failed to create item' });
    }

    // Add contact details as an update on the item
    const details = [
      `Email: ${email || '—'}`,
      `Company: ${company || '—'}`,
      `Trade: ${trade || '—'}`
    ].join('\n');

    await fetch('https://api.monday.com/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token,
        'API-Version': '2024-01'
      },
      body: JSON.stringify({
        query: `mutation {
          create_update(
            item_id: ${itemId},
            body: "${details.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"
          ) { id }
        }`
      })
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('submit error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
