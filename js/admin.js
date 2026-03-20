/* ===== BANTAYAN FERRY - ADMIN PANEL JS ===== */

let currentSection = 'dashboard';
let modalSaveCallback = null;

// ===== INIT =====
window.addEventListener('load', () => {
  const adminToken = localStorage.getItem('bf_admin_token');
  if (adminToken) {
    showDashboard();
    loadAdminSection('dashboard');
  }
});

// ===== AUTH =====
document.getElementById('admin-login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('admin-email').value;
  const password = document.getElementById('admin-password').value;
  const btn = document.getElementById('btn-admin-login');
  btn.textContent = 'Signing in...'; btn.disabled = true;
  const res = await api.post('/auth/admin/login', { email, password });
  btn.textContent = 'Sign In as Admin'; btn.disabled = false;
  if (res.ok) {
    localStorage.setItem('bf_admin_token', res.data.token);
    localStorage.setItem('bf_admin', JSON.stringify(res.data.admin));
    showToast('Welcome, ' + res.data.admin.full_name + '!', 'success');
    showDashboard();
    loadAdminSection('dashboard');
  } else { showToast(res.error, 'error'); }
});

function showDashboard() {
  document.getElementById('admin-login-screen').classList.add('hidden');
  document.getElementById('admin-dashboard-screen').classList.remove('hidden');
  const admin = JSON.parse(localStorage.getItem('bf_admin') || '{}');
  document.getElementById('admin-user-name').textContent = admin.full_name || '';
}

function adminLogout() {
  localStorage.removeItem('bf_admin_token');
  localStorage.removeItem('bf_admin');
  document.getElementById('admin-login-screen').classList.remove('hidden');
  document.getElementById('admin-dashboard-screen').classList.add('hidden');
  showToast('Logged out');
}

// ===== SIDEBAR =====
function toggleSidebar() {
  document.getElementById('admin-sidebar').classList.toggle('open');
  document.getElementById('sidebar-overlay').classList.toggle('show');
}
function closeSidebar() {
  document.getElementById('admin-sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('show');
}

// ===== SECTION LOADER =====
async function loadAdminSection(section) {
  currentSection = section;
  closeSidebar();
  // Update active sidebar item
  document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
  event?.target?.classList.add('active');
  const titles = { dashboard:'Dashboard', bookings:'Bookings Management', users:'Users Management', schedules:'Schedule Management', ships:'Ships Management', routes:'Routes Management', fares:'Fare Management', cargo:'Cargo Rates', 'shipping-lines':'Shipping Lines', admins:'Manage Admins' };
  document.getElementById('admin-page-title').textContent = titles[section] || section;
  const content = document.getElementById('admin-content');
  content.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';
  switch(section) {
    case 'dashboard': await renderDashboard(); break;
    case 'bookings': await renderBookings(); break;
    case 'users': await renderUsers(); break;
    case 'schedules': await renderSchedules(); break;
    case 'ships': await renderShips(); break;
    case 'routes': await renderRoutes(); break;
    case 'fares': await renderFares(); break;
    case 'cargo': await renderCargoRates(); break;
    case 'shipping-lines': await renderShippingLines(); break;
    case 'admins': await renderAdmins(); break;
  }
}

// ===== DASHBOARD =====
async function renderDashboard() {
  const res = await api.get('/admin/dashboard', true);
  if (!res.ok) { document.getElementById('admin-content').innerHTML = '<p style="padding:20px;color:red">Failed to load: ' + res.error + '</p>'; return; }
  const d = res.data;
  document.getElementById('admin-content').innerHTML = `
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-icon">📋</div><div class="stat-value">${d.total_bookings}</div><div class="stat-label">Total Bookings</div></div>
      <div class="stat-card"><div class="stat-icon">👥</div><div class="stat-value">${d.total_users}</div><div class="stat-label">Registered Users</div></div>
      <div class="stat-card"><div class="stat-icon">🕒</div><div class="stat-value">${d.active_schedules}</div><div class="stat-label">Active Schedules</div></div>
      <div class="stat-card"><div class="stat-icon">⏳</div><div class="stat-value">${d.pending_bookings}</div><div class="stat-label">Pending Bookings</div></div>
    </div>
    <div class="data-table-wrap" style="margin-top:8px">
      <div class="table-header"><h3>Quick Actions</h3></div>
      <div style="padding:16px;display:flex;flex-direction:column;gap:10px">
        <button class="btn btn-primary" style="width:auto;padding:12px 20px" onclick="loadAdminSection('bookings')">📋 View All Bookings</button>
        <button class="btn btn-secondary" style="width:auto;padding:12px 20px" onclick="openQRVerify()">📷 Verify QR Code</button>
        <button class="btn btn-secondary" style="width:auto;padding:12px 20px" onclick="loadAdminSection('schedules')">🕒 Manage Schedules</button>
      </div>
    </div>`;
}

// ===== BOOKINGS =====
async function renderBookings() {
  const res = await api.get('/admin/bookings', true);
  // Note: use bookings endpoint for admin
  const bRes = await api.get('/bookings', true);
  if (!bRes.ok) { document.getElementById('admin-content').innerHTML = errorHTML(bRes.error); return; }
  const bookings = bRes.data;
  document.getElementById('admin-content').innerHTML = `
    <div style="margin-bottom:12px;display:flex;gap:8px;flex-wrap:wrap">
      <button class="filter-chip active" onclick="filterAdminBookings('all',this)">All</button>
      <button class="filter-chip" onclick="filterAdminBookings('pending',this)">Pending</button>
      <button class="filter-chip" onclick="filterAdminBookings('verified',this)">Verified</button>
      <button class="filter-chip" onclick="filterAdminBookings('cancelled',this)">Cancelled</button>
      <button class="btn-add" onclick="openQRVerify()">📷 Scan QR</button>
    </div>
    <div class="data-table-wrap">
      <div class="data-table">
        <table>
          <thead><tr><th>Booking ID</th><th>Passenger</th><th>Route</th><th>Travel Date</th><th>Type</th><th>Fare</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody id="bookings-tbody">
            ${bookings.map(b => bookingRow(b)).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
  window._allAdminBookings = bookings;
}

function bookingRow(b) {
  return `<tr>
    <td style="font-weight:700;color:var(--ocean-mid);font-size:12px">${b.booking_code}</td>
    <td>${b.full_name}<br><span style="font-size:11px;color:var(--text-secondary)">${b.contact_number}</span></td>
    <td style="font-size:12px">${b.route_name}<br><span style="color:var(--text-secondary)">${b.shipping_line_name}</span></td>
    <td style="font-size:12px">${formatDateAdmin(b.travel_date)}</td>
    <td style="font-size:12px;text-transform:capitalize">${b.passenger_type.replace('_',' ')}</td>
    <td style="font-weight:700">₱${parseFloat(b.total_fare).toFixed(2)}</td>
    <td><span class="status-badge ${b.status}">${b.status}</span></td>
    <td><div class="action-btns">
      ${b.status === 'pending' ? `<button class="btn-edit" onclick="verifyBookingAdmin('${b.booking_code}')">✓ Verify</button>` : ''}
      ${b.status !== 'cancelled' ? `<button class="btn-del" onclick="cancelBookingAdmin(${b.id})">✕ Cancel</button>` : ''}
    </div></td>
  </tr>`;
}

function filterAdminBookings(status, el) {
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  const filtered = status === 'all' ? window._allAdminBookings : window._allAdminBookings.filter(b => b.status === status);
  document.getElementById('bookings-tbody').innerHTML = filtered.map(b => bookingRow(b)).join('');
}

async function verifyBookingAdmin(booking_code) {
  if (!confirm('Verify booking ' + booking_code + '?')) return;
  const res = await api.post('/bookings/verify', { booking_code }, true);
  if (res.ok) { showToast('Booking verified! ✅', 'success'); renderBookings(); }
  else showToast(res.error, 'error');
}

async function cancelBookingAdmin(id) {
  if (!confirm('Cancel this booking?')) return;
  const res = await api.patch(`/bookings/${id}/cancel`, {}, true);
  if (res.ok) { showToast('Booking cancelled', 'default'); renderBookings(); }
  else showToast(res.error, 'error');
}

function openQRVerify() {
  openModal('Verify QR / Booking Code', `
    <div class="form-group">
      <label>Enter Booking Code</label>
      <input type="text" id="qr-booking-code" class="form-control" placeholder="e.g. BF-XXXXX-XXXX" style="text-transform:uppercase">
    </div>
    <p style="font-size:12px;color:var(--text-secondary);margin-top:8px">For QR scanning, use Cordova's QR plugin to decode and paste here.</p>
  `, async () => {
    const code = document.getElementById('qr-booking-code').value.toUpperCase();
    if (!code) { showToast('Enter a booking code', 'error'); return; }
    const res = await api.post('/bookings/verify', { booking_code: code }, true);
    if (res.ok) { showToast('✅ Booking verified!', 'success'); closeModal(); if (currentSection === 'bookings') renderBookings(); }
    else showToast(res.error, 'error');
  });
}

// ===== USERS =====
async function renderUsers() {
  const res = await api.get('/admin/users', true);
  if (!res.ok) { document.getElementById('admin-content').innerHTML = errorHTML(res.error); return; }
  document.getElementById('admin-content').innerHTML = `
    <div class="data-table-wrap">
      <div class="table-header"><h3>All Users (${res.data.length})</h3></div>
      <div class="data-table"><table>
        <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Contact</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
        <tbody>${res.data.map(u => `<tr>
          <td>${u.id}</td><td style="font-weight:600">${u.full_name}</td><td>${u.email}</td>
          <td>${u.contact_number || '—'}</td>
          <td><span class="status-badge ${u.is_active ? 'verified' : 'cancelled'}">${u.is_active ? 'Active' : 'Inactive'}</span></td>
          <td style="font-size:12px">${formatDateAdmin(u.created_at)}</td>
          <td><div class="action-btns">
            <button class="btn-edit" onclick="editUser(${u.id},'${escHtml(u.full_name)}','${u.contact_number||''}',${u.is_active})">Edit</button>
            <button class="btn-del" onclick="deleteUser(${u.id})">Deactivate</button>
          </div></td>
        </tr>`).join('')}</tbody>
      </table></div>
    </div>`;
}

function editUser(id, full_name, contact_number, is_active) {
  openModal('Edit User', `
    <div class="form-group"><label>Full Name</label><input id="eu-name" class="form-control" value="${escHtml(full_name)}"></div>
    <div class="form-group" style="margin-top:12px"><label>Contact Number</label><input id="eu-contact" class="form-control" value="${contact_number}"></div>
    <div class="form-group" style="margin-top:12px"><label>Status</label>
      <select id="eu-active" class="form-control"><option value="1" ${is_active?'selected':''}>Active</option><option value="0" ${!is_active?'selected':''}>Inactive</option></select>
    </div>`, async () => {
    const res = await api.put(`/admin/users/${id}`, { full_name: document.getElementById('eu-name').value, contact_number: document.getElementById('eu-contact').value, is_active: document.getElementById('eu-active').value }, true);
    if (res.ok) { showToast('User updated', 'success'); closeModal(); renderUsers(); }
    else showToast(res.error, 'error');
  });
}

async function deleteUser(id) {
  if (!confirm('Deactivate this user?')) return;
  const res = await api.delete(`/admin/users/${id}`, true);
  if (res.ok) { showToast('User deactivated'); renderUsers(); }
  else showToast(res.error, 'error');
}

// ===== SCHEDULES =====
async function renderSchedules() {
  const [sRes, shRes, rRes, slRes] = await Promise.all([
    api.get('/schedules'),
    api.get('/admin/ships', true),
    api.get('/admin/routes', true),
    api.get('/admin/shipping-lines', true)
  ]);
  window._ships = shRes.ok ? shRes.data : [];
  window._routes = rRes.ok ? rRes.data : [];
  window._shippingLines = slRes.ok ? slRes.data : [];
  if (!sRes.ok) { document.getElementById('admin-content').innerHTML = errorHTML(sRes.error); return; }
  document.getElementById('admin-content').innerHTML = `
    <div class="data-table-wrap">
      <div class="table-header"><h3>Schedules (${sRes.data.length})</h3><button class="btn-add" onclick="addSchedule()">+ Add Schedule</button></div>
      <div class="data-table"><table>
        <thead><tr><th>ID</th><th>Shipping Line</th><th>Ship</th><th>Route</th><th>Departs</th><th>Arrives</th><th>Days</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>${sRes.data.map(s => `<tr>
          <td>${s.id}</td><td>${s.shipping_line_name}</td><td>${s.ship_name}</td>
          <td>${s.route_name}</td><td style="font-weight:700">${formatTimeAdmin(s.departure_time)}</td>
          <td style="font-weight:700">${formatTimeAdmin(s.arrival_time)}</td><td>${s.available_days}</td>
          <td><span class="status-badge ${s.is_active ? 'verified' : 'cancelled'}">${s.is_active ? 'Active' : 'Inactive'}</span></td>
          <td><div class="action-btns">
            <button class="btn-edit" onclick="editSchedule(${JSON.stringify(s).replace(/"/g,'&quot;')})">Edit</button>
            <button class="btn-del" onclick="deleteSchedule(${s.id})">Delete</button>
          </div></td>
        </tr>`).join('')}</tbody>
      </table></div>
    </div>`;
}

function scheduleFormHTML(s = {}) {
  const ships = (window._ships || []).map(sh => `<option value="${sh.id}" ${s.ship_id == sh.id ? 'selected' : ''}>${sh.name} (${sh.shipping_line_name})</option>`).join('');
  const routes = (window._routes || []).map(r => `<option value="${r.id}" ${s.route_id == r.id ? 'selected' : ''}>${r.origin} → ${r.destination}</option>`).join('');
  const lines = (window._shippingLines || []).map(l => `<option value="${l.id}" ${s.shipping_line_id == l.id ? 'selected' : ''}>${l.name}</option>`).join('');
  return `
    <div class="form-group"><label>Shipping Line</label><select id="sf-line" class="form-control">${lines}</select></div>
    <div class="form-group" style="margin-top:12px"><label>Ship</label><select id="sf-ship" class="form-control">${ships}</select></div>
    <div class="form-group" style="margin-top:12px"><label>Route</label><select id="sf-route" class="form-control">${routes}</select></div>
    <div class="form-group" style="margin-top:12px"><label>Departure Time</label><input type="time" id="sf-depart" class="form-control" value="${s.departure_time || ''}"></div>
    <div class="form-group" style="margin-top:12px"><label>Arrival Time</label><input type="time" id="sf-arrive" class="form-control" value="${s.arrival_time || ''}"></div>
    <div class="form-group" style="margin-top:12px"><label>Available Days</label>
      <select id="sf-days" class="form-control">
        <option value="daily" ${s.available_days==='daily'?'selected':''}>Daily</option>
        <option value="weekdays" ${s.available_days==='weekdays'?'selected':''}>Weekdays</option>
        <option value="weekends" ${s.available_days==='weekends'?'selected':''}>Weekends</option>
      </select>
    </div>`;
}

function addSchedule() {
  openModal('Add Schedule', scheduleFormHTML(), async () => {
    const payload = { ship_id: document.getElementById('sf-ship').value, route_id: document.getElementById('sf-route').value, shipping_line_id: document.getElementById('sf-line').value, departure_time: document.getElementById('sf-depart').value, arrival_time: document.getElementById('sf-arrive').value, available_days: document.getElementById('sf-days').value };
    const res = await api.post('/schedules', payload, true);
    if (res.ok) { showToast('Schedule added', 'success'); closeModal(); renderSchedules(); } else showToast(res.error, 'error');
  });
}

function editSchedule(s) {
  openModal('Edit Schedule', scheduleFormHTML(s), async () => {
    const payload = { ship_id: document.getElementById('sf-ship').value, route_id: document.getElementById('sf-route').value, shipping_line_id: document.getElementById('sf-line').value, departure_time: document.getElementById('sf-depart').value, arrival_time: document.getElementById('sf-arrive').value, available_days: document.getElementById('sf-days').value, is_active: 1 };
    const res = await api.put(`/schedules/${s.id}`, payload, true);
    if (res.ok) { showToast('Schedule updated', 'success'); closeModal(); renderSchedules(); } else showToast(res.error, 'error');
  });
}

async function deleteSchedule(id) {
  if (!confirm('Deactivate this schedule?')) return;
  const res = await api.delete(`/schedules/${id}`, true);
  if (res.ok) { showToast('Schedule deactivated'); renderSchedules(); } else showToast(res.error, 'error');
}

// ===== SHIPS =====
async function renderShips() {
  const [res, slRes] = await Promise.all([api.get('/admin/ships', true), api.get('/admin/shipping-lines', true)]);
  window._shippingLines = slRes.ok ? slRes.data : [];
  if (!res.ok) { document.getElementById('admin-content').innerHTML = errorHTML(res.error); return; }
  document.getElementById('admin-content').innerHTML = `
    <div class="data-table-wrap">
      <div class="table-header"><h3>Ships (${res.data.length})</h3><button class="btn-add" onclick="addShip()">+ Add Ship</button></div>
      <div class="data-table"><table>
        <thead><tr><th>ID</th><th>Name</th><th>Shipping Line</th><th>Capacity</th><th>Description</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>${res.data.map(s => `<tr>
          <td>${s.id}</td><td style="font-weight:600">${s.name}</td><td>${s.shipping_line_name}</td>
          <td>${s.capacity} pax</td><td style="font-size:12px">${s.description || '—'}</td>
          <td><span class="status-badge ${s.is_active ? 'verified' : 'cancelled'}">${s.is_active ? 'Active' : 'Inactive'}</span></td>
          <td><div class="action-btns">
            <button class="btn-edit" onclick="editShip(${s.id},'${escHtml(s.name)}',${s.shipping_line_id},${s.capacity},'${escHtml(s.description||'')}',${s.is_active})">Edit</button>
            <button class="btn-del" onclick="deleteShip(${s.id})">Delete</button>
          </div></td>
        </tr>`).join('')}</tbody>
      </table></div>
    </div>`;
}

function shipFormHTML(data = {}) {
  const lines = (window._shippingLines || []).map(l => `<option value="${l.id}" ${data.shipping_line_id == l.id ? 'selected' : ''}>${l.name}</option>`).join('');
  return `
    <div class="form-group"><label>Ship Name</label><input id="ship-name" class="form-control" value="${escHtml(data.name||'')}"></div>
    <div class="form-group" style="margin-top:12px"><label>Shipping Line</label><select id="ship-line" class="form-control">${lines}</select></div>
    <div class="form-group" style="margin-top:12px"><label>Capacity (passengers)</label><input type="number" id="ship-cap" class="form-control" value="${data.capacity||''}"></div>
    <div class="form-group" style="margin-top:12px"><label>Description</label><input id="ship-desc" class="form-control" value="${escHtml(data.description||'')}"></div>`;
}

function addShip() {
  openModal('Add Ship', shipFormHTML(), async () => {
    const res = await api.post('/admin/ships', { name: document.getElementById('ship-name').value, shipping_line_id: document.getElementById('ship-line').value, capacity: document.getElementById('ship-cap').value, description: document.getElementById('ship-desc').value }, true);
    if (res.ok) { showToast('Ship added', 'success'); closeModal(); renderShips(); } else showToast(res.error, 'error');
  });
}

function editShip(id, name, shipping_line_id, capacity, description, is_active) {
  openModal('Edit Ship', shipFormHTML({ name, shipping_line_id, capacity, description }), async () => {
    const res = await api.put(`/admin/ships/${id}`, { name: document.getElementById('ship-name').value, shipping_line_id: document.getElementById('ship-line').value, capacity: document.getElementById('ship-cap').value, description: document.getElementById('ship-desc').value, is_active }, true);
    if (res.ok) { showToast('Ship updated', 'success'); closeModal(); renderShips(); } else showToast(res.error, 'error');
  });
}

async function deleteShip(id) {
  if (!confirm('Delete this ship?')) return;
  const res = await api.delete(`/admin/ships/${id}`, true);
  if (res.ok) { showToast('Ship deleted'); renderShips(); } else showToast(res.error, 'error');
}

// ===== ROUTES =====
async function renderRoutes() {
  const res = await api.get('/admin/routes', true);
  if (!res.ok) { document.getElementById('admin-content').innerHTML = errorHTML(res.error); return; }
  document.getElementById('admin-content').innerHTML = `
    <div class="data-table-wrap">
      <div class="table-header"><h3>Routes (${res.data.length})</h3><button class="btn-add" onclick="addRoute()">+ Add Route</button></div>
      <div class="data-table"><table>
        <thead><tr><th>ID</th><th>Origin</th><th>Destination</th><th>Distance</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>${res.data.map(r => `<tr>
          <td>${r.id}</td><td style="font-weight:600">${r.origin}</td><td style="font-weight:600">${r.destination}</td>
          <td>${r.distance_km ? r.distance_km + ' km' : '—'}</td>
          <td><span class="status-badge verified">Active</span></td>
          <td><div class="action-btns">
            <button class="btn-edit" onclick="editRoute(${r.id},'${r.origin}','${r.destination}','${r.distance_km||''}')">Edit</button>
            <button class="btn-del" onclick="deleteRoute(${r.id})">Delete</button>
          </div></td>
        </tr>`).join('')}</tbody>
      </table></div>
    </div>`;
}

function routeFormHTML(data = {}) {
  return `
    <div class="form-group"><label>Origin</label><input id="rt-origin" class="form-control" value="${data.origin||''}" placeholder="e.g. Hagnaya"></div>
    <div class="form-group" style="margin-top:12px"><label>Destination</label><input id="rt-dest" class="form-control" value="${data.destination||''}" placeholder="e.g. Santa Fe"></div>
    <div class="form-group" style="margin-top:12px"><label>Distance (km)</label><input type="number" id="rt-dist" class="form-control" value="${data.distance_km||''}"></div>`;
}

function addRoute() {
  openModal('Add Route', routeFormHTML(), async () => {
    const res = await api.post('/admin/routes', { origin: document.getElementById('rt-origin').value, destination: document.getElementById('rt-dest').value, distance_km: document.getElementById('rt-dist').value }, true);
    if (res.ok) { showToast('Route added', 'success'); closeModal(); renderRoutes(); } else showToast(res.error, 'error');
  });
}

function editRoute(id, origin, destination, distance_km) {
  openModal('Edit Route', routeFormHTML({ origin, destination, distance_km }), async () => {
    const res = await api.put(`/admin/routes/${id}`, { origin: document.getElementById('rt-origin').value, destination: document.getElementById('rt-dest').value, distance_km: document.getElementById('rt-dist').value, is_active: 1 }, true);
    if (res.ok) { showToast('Route updated', 'success'); closeModal(); renderRoutes(); } else showToast(res.error, 'error');
  });
}

async function deleteRoute(id) {
  if (!confirm('Delete this route?')) return;
  const res = await api.delete(`/admin/routes/${id}`, true);
  if (res.ok) { showToast('Route deleted'); renderRoutes(); } else showToast(res.error, 'error');
}

// ===== FARES =====
async function renderFares() {
  const [res, slRes, rRes] = await Promise.all([api.get('/admin/fares', true), api.get('/admin/shipping-lines', true), api.get('/admin/routes', true)]);
  window._shippingLines = slRes.ok ? slRes.data : [];
  window._routes = rRes.ok ? rRes.data : [];
  if (!res.ok) { document.getElementById('admin-content').innerHTML = errorHTML(res.error); return; }
  document.getElementById('admin-content').innerHTML = `
    <div class="data-table-wrap">
      <div class="table-header"><h3>Fare Matrix (${res.data.length})</h3><button class="btn-add" onclick="addFare()">+ Add Fare</button></div>
      <div class="data-table"><table>
        <thead><tr><th>Shipping Line</th><th>Route</th><th>Passenger Type</th><th>Amount</th><th>Actions</th></tr></thead>
        <tbody>${res.data.map(f => `<tr>
          <td>${f.shipping_line_name}</td><td>${f.route_name}</td>
          <td style="text-transform:capitalize">${f.passenger_type.replace('_',' ')}</td>
          <td style="font-weight:700;color:var(--ocean-mid)">₱${parseFloat(f.amount).toFixed(2)}</td>
          <td><div class="action-btns">
            <button class="btn-edit" onclick="editFare(${f.id},${f.shipping_line_id},${f.route_id},'${f.passenger_type}',${f.amount})">Edit</button>
            <button class="btn-del" onclick="deleteFare(${f.id})">Delete</button>
          </div></td>
        </tr>`).join('')}</tbody>
      </table></div>
    </div>`;
}

function fareFormHTML(data = {}) {
  const lines = (window._shippingLines || []).map(l => `<option value="${l.id}" ${data.shipping_line_id == l.id ? 'selected' : ''}>${l.name}</option>`).join('');
  const routes = (window._routes || []).map(r => `<option value="${r.id}" ${data.route_id == r.id ? 'selected' : ''}>${r.origin} → ${r.destination}</option>`).join('');
  const paxTypes = ['regular','student','senior_citizen','pwd','child'];
  const paxOpts = paxTypes.map(t => `<option value="${t}" ${data.passenger_type === t ? 'selected' : ''}>${t.replace('_',' ')}</option>`).join('');
  return `
    <div class="form-group"><label>Shipping Line</label><select id="fare-line" class="form-control">${lines}</select></div>
    <div class="form-group" style="margin-top:12px"><label>Route</label><select id="fare-route" class="form-control">${routes}</select></div>
    <div class="form-group" style="margin-top:12px"><label>Passenger Type</label><select id="fare-pax" class="form-control" style="text-transform:capitalize">${paxOpts}</select></div>
    <div class="form-group" style="margin-top:12px"><label>Amount (₱)</label><input type="number" step="0.01" id="fare-amount" class="form-control" value="${data.amount||''}"></div>`;
}

function addFare() {
  openModal('Add Fare', fareFormHTML(), async () => {
    const res = await api.post('/admin/fares', { shipping_line_id: document.getElementById('fare-line').value, route_id: document.getElementById('fare-route').value, passenger_type: document.getElementById('fare-pax').value, amount: document.getElementById('fare-amount').value }, true);
    if (res.ok) { showToast('Fare added', 'success'); closeModal(); renderFares(); } else showToast(res.error, 'error');
  });
}

function editFare(id, shipping_line_id, route_id, passenger_type, amount) {
  openModal('Edit Fare', fareFormHTML({ shipping_line_id, route_id, passenger_type, amount }), async () => {
    const res = await api.put(`/admin/fares/${id}`, { shipping_line_id: document.getElementById('fare-line').value, route_id: document.getElementById('fare-route').value, passenger_type: document.getElementById('fare-pax').value, amount: document.getElementById('fare-amount').value }, true);
    if (res.ok) { showToast('Fare updated', 'success'); closeModal(); renderFares(); } else showToast(res.error, 'error');
  });
}

async function deleteFare(id) {
  if (!confirm('Delete this fare?')) return;
  const res = await api.delete(`/admin/fares/${id}`, true);
  if (res.ok) { showToast('Fare deleted'); renderFares(); } else showToast(res.error, 'error');
}

// ===== CARGO RATES =====
async function renderCargoRates() {
  const [res, slRes] = await Promise.all([api.get('/admin/cargo-rates', true), api.get('/admin/shipping-lines', true)]);
  window._shippingLines = slRes.ok ? slRes.data : [];
  if (!res.ok) { document.getElementById('admin-content').innerHTML = errorHTML(res.error); return; }
  document.getElementById('admin-content').innerHTML = `
    <div class="data-table-wrap">
      <div class="table-header"><h3>Cargo Rates (${res.data.length})</h3><button class="btn-add" onclick="addCargoRate()">+ Add Rate</button></div>
      <div class="data-table"><table>
        <thead><tr><th>Shipping Line</th><th>Cargo Type</th><th>Amount</th><th>Actions</th></tr></thead>
        <tbody>${res.data.map(c => `<tr>
          <td>${c.shipping_line_name}</td>
          <td style="text-transform:capitalize">${c.cargo_type}</td>
          <td style="font-weight:700;color:var(--ocean-mid)">₱${parseFloat(c.amount).toFixed(2)}</td>
          <td><div class="action-btns">
            <button class="btn-edit" onclick="editCargoRate(${c.id},${c.shipping_line_id},'${c.cargo_type}',${c.amount})">Edit</button>
            <button class="btn-del" onclick="deleteCargoRate(${c.id})">Delete</button>
          </div></td>
        </tr>`).join('')}</tbody>
      </table></div>
    </div>`;
}

function cargoFormHTML(data = {}) {
  const lines = (window._shippingLines || []).map(l => `<option value="${l.id}" ${data.shipping_line_id == l.id ? 'selected' : ''}>${l.name}</option>`).join('');
  return `
    <div class="form-group"><label>Shipping Line</label><select id="cargo-line" class="form-control">${lines}</select></div>
    <div class="form-group" style="margin-top:12px"><label>Cargo Type</label>
      <select id="cargo-type" class="form-control">
        <option value="motorcycle" ${data.cargo_type==='motorcycle'?'selected':''}>Motorcycle</option>
        <option value="car" ${data.cargo_type==='car'?'selected':''}>Car</option>
        <option value="truck" ${data.cargo_type==='truck'?'selected':''}>Truck</option>
        <option value="others" ${data.cargo_type==='others'?'selected':''}>Others</option>
      </select>
    </div>
    <div class="form-group" style="margin-top:12px"><label>Amount (₱)</label><input type="number" step="0.01" id="cargo-amount" class="form-control" value="${data.amount||''}"></div>`;
}

function addCargoRate() {
  openModal('Add Cargo Rate', cargoFormHTML(), async () => {
    const res = await api.post('/admin/cargo-rates', { shipping_line_id: document.getElementById('cargo-line').value, cargo_type: document.getElementById('cargo-type').value, amount: document.getElementById('cargo-amount').value }, true);
    if (res.ok) { showToast('Cargo rate added', 'success'); closeModal(); renderCargoRates(); } else showToast(res.error, 'error');
  });
}

function editCargoRate(id, shipping_line_id, cargo_type, amount) {
  openModal('Edit Cargo Rate', cargoFormHTML({ shipping_line_id, cargo_type, amount }), async () => {
    const res = await api.put(`/admin/cargo-rates/${id}`, { shipping_line_id: document.getElementById('cargo-line').value, cargo_type: document.getElementById('cargo-type').value, amount: document.getElementById('cargo-amount').value }, true);
    if (res.ok) { showToast('Cargo rate updated', 'success'); closeModal(); renderCargoRates(); } else showToast(res.error, 'error');
  });
}

async function deleteCargoRate(id) {
  if (!confirm('Delete this cargo rate?')) return;
  const res = await api.delete(`/admin/cargo-rates/${id}`, true);
  if (res.ok) { showToast('Deleted'); renderCargoRates(); } else showToast(res.error, 'error');
}

// ===== SHIPPING LINES =====
async function renderShippingLines() {
  const res = await api.get('/admin/shipping-lines', true);
  if (!res.ok) { document.getElementById('admin-content').innerHTML = errorHTML(res.error); return; }
  document.getElementById('admin-content').innerHTML = `
    <div class="data-table-wrap">
      <div class="table-header"><h3>Shipping Lines (${res.data.length})</h3><button class="btn-add" onclick="addShippingLine()">+ Add Line</button></div>
      <div class="data-table"><table>
        <thead><tr><th>ID</th><th>Name</th><th>Description</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>${res.data.map(l => `<tr>
          <td>${l.id}</td><td style="font-weight:600">${l.name}</td><td style="font-size:12px">${l.description||'—'}</td>
          <td><span class="status-badge ${l.is_active?'verified':'cancelled'}">${l.is_active?'Active':'Inactive'}</span></td>
          <td><div class="action-btns">
            <button class="btn-edit" onclick="editShippingLine(${l.id},'${escHtml(l.name)}','${escHtml(l.description||'')}',${l.is_active})">Edit</button>
            <button class="btn-del" onclick="deleteShippingLine(${l.id})">Delete</button>
          </div></td>
        </tr>`).join('')}</tbody>
      </table></div>
    </div>`;
}

function slFormHTML(data = {}) {
  return `
    <div class="form-group"><label>Name</label><input id="sl-name" class="form-control" value="${escHtml(data.name||'')}"></div>
    <div class="form-group" style="margin-top:12px"><label>Description</label><input id="sl-desc" class="form-control" value="${escHtml(data.description||'')}"></div>`;
}

function addShippingLine() {
  openModal('Add Shipping Line', slFormHTML(), async () => {
    const res = await api.post('/admin/shipping-lines', { name: document.getElementById('sl-name').value, description: document.getElementById('sl-desc').value }, true);
    if (res.ok) { showToast('Shipping line added', 'success'); closeModal(); renderShippingLines(); } else showToast(res.error, 'error');
  });
}

function editShippingLine(id, name, description, is_active) {
  openModal('Edit Shipping Line', slFormHTML({ name, description }), async () => {
    const res = await api.put(`/admin/shipping-lines/${id}`, { name: document.getElementById('sl-name').value, description: document.getElementById('sl-desc').value, is_active }, true);
    if (res.ok) { showToast('Updated', 'success'); closeModal(); renderShippingLines(); } else showToast(res.error, 'error');
  });
}

async function deleteShippingLine(id) {
  if (!confirm('Delete this shipping line? This may affect related data.')) return;
  const res = await api.delete(`/admin/shipping-lines/${id}`, true);
  if (res.ok) { showToast('Deleted'); renderShippingLines(); } else showToast(res.error, 'error');
}

// ===== ADMINS =====
async function renderAdmins() {
  const res = await api.get('/admin/admins', true);
  if (!res.ok) { document.getElementById('admin-content').innerHTML = errorHTML(res.error); return; }
  document.getElementById('admin-content').innerHTML = `
    <div class="data-table-wrap">
      <div class="table-header"><h3>Admin Accounts (${res.data.length})</h3><button class="btn-add" onclick="addAdmin()">+ Add Admin</button></div>
      <div class="data-table"><table>
        <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>${res.data.map(a => `<tr>
          <td>${a.id}</td><td style="font-weight:600">${a.full_name}</td><td>${a.email}</td>
          <td><span style="padding:4px 8px;border-radius:6px;font-size:11px;font-weight:700;background:rgba(21,101,168,0.1);color:var(--ocean-mid)">${a.role}</span></td>
          <td><span class="status-badge ${a.is_active?'verified':'cancelled'}">${a.is_active?'Active':'Inactive'}</span></td>
          <td><div class="action-btns">
            <button class="btn-edit" onclick="editAdmin(${a.id},'${escHtml(a.full_name)}','${a.email}','${a.role}',${a.is_active})">Edit</button>
            <button class="btn-del" onclick="deleteAdmin(${a.id})">Delete</button>
          </div></td>
        </tr>`).join('')}</tbody>
      </table></div>
    </div>`;
}

function adminFormHTML(data = {}) {
  return `
    <div class="form-group"><label>Full Name</label><input id="adm-name" class="form-control" value="${escHtml(data.full_name||'')}"></div>
    <div class="form-group" style="margin-top:12px"><label>Email</label><input type="email" id="adm-email" class="form-control" value="${data.email||''}"></div>
    ${!data.id ? `<div class="form-group" style="margin-top:12px"><label>Password</label><input type="password" id="adm-pass" class="form-control"></div>` : ''}
    <div class="form-group" style="margin-top:12px"><label>Role</label>
      <select id="adm-role" class="form-control">
        <option value="admin" ${data.role==='admin'?'selected':''}>Admin</option>
        <option value="superadmin" ${data.role==='superadmin'?'selected':''}>Super Admin</option>
      </select>
    </div>`;
}

function addAdmin() {
  openModal('Add Admin', adminFormHTML(), async () => {
    const res = await api.post('/admin/admins', { full_name: document.getElementById('adm-name').value, email: document.getElementById('adm-email').value, password: document.getElementById('adm-pass').value, role: document.getElementById('adm-role').value }, true);
    if (res.ok) { showToast('Admin added', 'success'); closeModal(); renderAdmins(); } else showToast(res.error, 'error');
  });
}

function editAdmin(id, full_name, email, role, is_active) {
  openModal('Edit Admin', adminFormHTML({ id, full_name, email, role }), async () => {
    const res = await api.put(`/admin/admins/${id}`, { full_name: document.getElementById('adm-name').value, email: document.getElementById('adm-email').value, role: document.getElementById('adm-role').value, is_active }, true);
    if (res.ok) { showToast('Admin updated', 'success'); closeModal(); renderAdmins(); } else showToast(res.error, 'error');
  });
}

async function deleteAdmin(id) {
  if (!confirm('Delete this admin account?')) return;
  const res = await api.delete(`/admin/admins/${id}`, true);
  if (res.ok) { showToast('Admin deleted'); renderAdmins(); } else showToast(res.error, 'error');
}

// ===== MODAL =====
function openModal(title, bodyHTML, saveCallback) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = bodyHTML;
  document.getElementById('modal-overlay').classList.add('open');
  modalSaveCallback = saveCallback;
}
function closeModal() { document.getElementById('modal-overlay').classList.remove('open'); modalSaveCallback = null; }
function saveModal() { if (modalSaveCallback) modalSaveCallback(); }
document.getElementById('modal-overlay').addEventListener('click', (e) => { if (e.target === document.getElementById('modal-overlay')) closeModal(); });

// ===== HELPERS =====
function showToast(msg, type = 'default', duration = 3000) {
  const toast = document.getElementById('toast');
  toast.textContent = msg; toast.className = `toast ${type} show`;
  setTimeout(() => toast.classList.remove('show'), duration);
}
function formatDateAdmin(d) { if (!d) return '—'; return new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }); }
function formatTimeAdmin(t) {
  if (!t) return ''; const parts = t.split(':'); let h = parseInt(parts[0]), m = parts[1];
  const ampm = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; return `${h}:${m} ${ampm}`;
}
function escHtml(str) { return String(str).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function errorHTML(msg) { return `<div class="empty-state"><div class="empty-icon">⚠️</div><h3>Error</h3><p>${msg}</p></div>`; }
