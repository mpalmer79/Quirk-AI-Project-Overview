const state = { inv: [], byModel: new Map(), selected: null };

async function load() {
  // Copy your sandbox file into /web/ so this path works
  const inv = await fetch('./inventory.json').then(r => r.json());
  state.inv = inv;

  // Build model groups
  inv.forEach(v => {
    const key = v.model;
    if (!state.byModel.has(key)) state.byModel.set(key, []);
    state.byModel.get(key).push(v);
  });

  const select = document.getElementById('modelSelect');
  [...state.byModel.keys()].sort().forEach(m => {
    const opt = document.createElement('option');
    opt.value = m; opt.textContent = `${m} (${state.byModel.get(m).length})`;
    select.appendChild(opt);
  });

  select.addEventListener('change', render);
  document.getElementById('leadName').addEventListener('input', render);
  document.getElementById('agent').addEventListener('input', render);
  document.getElementById('incentive').addEventListener('input', render);

  // initial selection
  select.value = select.options[0].value;
  render();
}

function pickVehicle(list) {
  // prefer in_stock, else first
  return list.find(v => v.status !== 'sold') || list[0];
}

function templateEmail(vars) {
  // Mirrors your library pattern: inventory + incentive + two time slots:contentReference[oaicite:3]{index=3}
  return `Hi ${vars.name}, thanks for your interest in the ${vars.model_trim}.
We currently have ${vars.stock_count} in stock. ${vars.incentive_line}
Would Thursday at ${vars.slot1} or Saturday at ${vars.slot2} work best for a quick drive?
— ${vars.agent}, ${vars.store}

${vars.primary_photo}

(Stock ${vars.stock_number}, VIN ${vars.vin})`;
}

function templateSms(vars) {
  return `Hi ${vars.name}, it’s ${vars.agent} at ${vars.store}. ${vars.model_trim} available now (stock ${vars.stock_number}).
Thursday ${vars.slot1} or Saturday ${vars.slot2}?`;
}

function render() {
  const model = document.getElementById('modelSelect').value;
  const list = state.byModel.get(model) || [];
  const v = pickVehicle(list);

  const slots = ["6:15 PM", "10:30 AM"]; // matches library cadence:contentReference[oaicite:4]{index=4}
  const [agentName, storeName] = (document.getElementById('agent').value || 'Your BDC Team / Quirk').split('/');
  const vars = {
    name: (document.getElementById('leadName').value || 'there').trim(),
    agent: (agentName || 'Your BDC Team').trim(),
    store: (storeName || 'Quirk').trim(),
    model_trim: `${v.year} ${v.make} ${v.model}${v.trim ? ' ' + v.trim : ''}`,
    stock_count: list.length,
    primary_photo: v.photo_url_primary || '',
    vin: v.vin, stock_number: v.stock_number,
    price: v.price, msrp: v.msrp,
    slot1: slots[0], slot2: slots[1],
    incentive_line: (document.getElementById('incentive').value || '').trim()
  };

  document.getElementById('emailOut').value = templateEmail(vars);
  document.getElementById('smsOut').value = templateSms(vars);
  document.getElementById('veh').innerHTML = `
    <strong>${vars.model_trim}</strong><br/>
    Price $${v.price} (MSRP $${v.msrp}) — Status: ${v.status}<br/>
    <img src="${v.photo_url_primary}" alt="vehicle photo"/>
  `;
}

load();
