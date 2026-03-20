/* ===== BANTAYAN FERRY - MAIN APP ===== */

// ===== PAGE ROUTER =====
const router = {
  current: null,
  navigate(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const page = document.getElementById(pageId);
    if (page) { page.classList.add('active'); this.current = pageId; }

    // Update ALL nav-item buttons across ALL pages
    const navMap = { 'page-home': 'nav-home', 'page-schedules': 'nav-schedules', 'page-bookings': 'nav-bookings', 'page-profile': 'nav-profile' };
    const activeNavId = navMap[pageId];
    document.querySelectorAll('.nav-item').forEach(n => {
      if (activeNavId && n.id === activeNavId) n.classList.add('active');
      else n.classList.remove('active');
    });

    window.scrollTo(0, 0);
  }
};

// ===== TOAST =====
function showToast(msg, type = 'default', duration = 3000) {
  const toast = document.getElementById('toast');
  toast.textContent = msg; toast.className = `toast ${type} show`;
  setTimeout(() => toast.classList.remove('show'), duration);
}

// ===== SPLASH =====
window.addEventListener('load', () => {
  setTimeout(() => {
    document.getElementById('splash').style.opacity = '0';
    setTimeout(() => {
      document.getElementById('splash').style.display = 'none';
      if (api.isLoggedIn()) { router.navigate('page-home'); loadHome(); }
      else { router.navigate('page-auth'); }
    }, 600);
  }, 1800);
});

// ===== AUTH =====
document.getElementById('tab-login').addEventListener('click', () => {
  document.getElementById('tab-login').classList.add('active');
  document.getElementById('tab-register').classList.remove('active');
  document.getElementById('form-login').classList.remove('hidden');
  document.getElementById('form-register').classList.add('hidden');
});
document.getElementById('tab-register').addEventListener('click', () => {
  document.getElementById('tab-register').classList.add('active');
  document.getElementById('tab-login').classList.remove('active');
  document.getElementById('form-register').classList.remove('hidden');
  document.getElementById('form-login').classList.add('hidden');
});

document.getElementById('form-login').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const btn = document.getElementById('btn-login');
  btn.textContent = 'Signing in...'; btn.disabled = true;

  // ✅ Updated endpoint
  const res = await api.post('/api/auth/login', { email, password });

  btn.textContent = 'Sign In'; btn.disabled = false;
  if (res.ok) {
    localStorage.setItem('bf_token', res.data.token);
    localStorage.setItem('bf_user', JSON.stringify(res.data.user));
    showToast('Welcome back! 🚢', 'success');
    router.navigate('page-home'); loadHome();
  } else { showToast(res.error, 'error'); }
});

document.getElementById('form-register').addEventListener('submit', async (e) => {
  e.preventDefault();
  const full_name = document.getElementById('reg-name').value;
  const email = document.getElementById('reg-email').value;
  const password = document.getElementById('reg-password').value;
  const contact_number = document.getElementById('reg-contact').value;
  const btn = document.getElementById('btn-register');
  btn.textContent = 'Creating account...'; btn.disabled = true;

  // ✅ Updated endpoint
  const res = await api.post('/api/auth/register', { full_name, email, password, contact_number });

  btn.textContent = 'Create Account'; btn.disabled = false;
  if (res.ok) {
    localStorage.setItem('bf_token', res.data.token);
    localStorage.setItem('bf_user', JSON.stringify(res.data.user));
    showToast('Account created! Welcome 🎉', 'success');
    router.navigate('page-home'); loadHome();
  } else { showToast(res.error, 'error'); }
});

// ===== HOME =====
function loadHome() {
  const user = api.getUser();
  if (user) document.getElementById('home-greeting').textContent = `Hello, ${user.full_name.split(' ')[0]}! 👋`;
}

// ===== SCHEDULES =====
let allSchedules = [];
let activeLineFilter = 'all';

async function loadSchedules() {
  const list = document.getElementById('schedules-list');
  list.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';
  
  // ✅ Updated endpoint
  const res = await api.get('/api/schedules');
  if (!res.ok) { list.innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div><h3>Failed to load schedules</h3></div>'; return; }
  allSchedules = res.data;
  renderSchedules(allSchedules);
}

function renderSchedules(schedules) {
  const list = document.getElementById('schedules-list');
  if (schedules.length === 0) {
    list.innerHTML = '<div class="empty-state"><div class="empty-icon">🚢</div><h3>No schedules found</h3><p>Try a different filter</p></div>'; return;
  }
  const lineColors = { 'Island Shipping': '#1565a8', 'Super Shuttle Ferry': '#0ea5e9', 'Aznar Shipping': '#06d6c5' };
  list.innerHTML = schedules.map(s => `
    <div class="schedule-card" onclick="selectSchedule(${s.id})" style="border-left-color: ${lineColors[s.shipping_line_name] || '#0ea5e9'}">
      <div class="schedule-line">${s.shipping_line_name} • ${s.ship_name}</div>
      <div class="schedule-route">
        <div><div class="schedule-time">${formatTime(s.departure_time)}</div><div class="schedule-stops">${s.origin}</div></div>
        <div class="schedule-arrow">⟶</div>
        <div style="text-align:right"><div class="schedule-time">${formatTime(s.arrival_time)}</div><div class="schedule-stops">${s.destination}</div></div>
      </div>
      <div class="schedule-footer">
        <div class="schedule-ship">🚢 <span>${s.ship_name}</span> • Cap: ${s.capacity}</div>
        <div style="font-size:12px;color:var(--success)">● ${s.available_days}</div>
      </div>
    </div>`).join('');
}

function filterSchedules(lineId, event) {
  activeLineFilter = lineId;
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  if (event) event.target.classList.add('active');
  const filtered = lineId === 'all' ? allSchedules : allSchedules.filter(s => s.shipping_line_id == lineId);
  renderSchedules(filtered);
}

function selectSchedule(id) {
  const sched = allSchedules.find(s => s.id === id);
  if (!sched) return;
  if (!api.isLoggedIn()) { showToast('Please login to book a ticket', 'error'); router.navigate('page-auth'); return; }
  selectedSchedule = sched;
  openBookingForm(sched);
}

// ===== BOOKING FORM =====
let selectedSchedule = null;
let selectedPassengerType = 'regular';
let currentFare = 0;
const paxFareLabels = { regular: 'Regular', student: 'Student', senior_citizen: 'Senior Citizen', pwd: 'PWD', child: 'Child' };

function openBookingForm(sched) {
  document.getElementById('book-route').textContent = `${sched.origin} → ${sched.destination}`;
  document.getElementById('book-line').textContent = sched.shipping_line_name;
  document.getElementById('book-ship').textContent = sched.ship_name;
  document.getElementById('book-depart').textContent = formatTime(sched.departure_time);
  document.getElementById('book-arrive').textContent = formatTime(sched.arrival_time);
  document.getElementById('booking-schedule-id').value = sched.id;
  const user = api.getUser();
  if (user) {
    document.getElementById('book-name').value = user.full_name;
    document.getElementById('book-contact').value = user.contact_number || '';
  }
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('book-date').min = today;
  document.getElementById('book-date').value = today;
  selectPassengerType('regular');
  router.navigate('page-booking');
}

function selectPassengerType(type) {
  selectedPassengerType = type;
  document.querySelectorAll('.pax-btn').forEach(b => b.classList.remove('selected'));
  document.querySelector(`.pax-btn[data-type="${type}"]`)?.classList.add('selected');
  updateFareDisplay();
}

async function updateFareDisplay() {
  if (!selectedSchedule) return;
  document.getElementById('fare-passenger-type').textContent = paxFareLabels[selectedPassengerType];
  document.getElementById('fare-amount-display').textContent = '...';
  
  // ✅ Updated endpoint
  const res = await api.get('/api/admin/fares', true);
  if (res.ok) {
    const fare = res.data.find(f => f.shipping_line_id === selectedSchedule.shipping_line_id && f.passenger_type === selectedPassengerType);
    if (fare) { currentFare = fare.amount; document.getElementById('fare-amount-display').textContent = `₱${parseFloat(fare.amount).toFixed(2)}`; return; }
  }
  
  const fallback = { regular: 185, student: 140, senior_citizen: 130, pwd: 130, child: 95 };
  currentFare = fallback[selectedPassengerType];
  document.getElementById('fare-amount-display').textContent = `₱${currentFare.toFixed(2)}`;
}

document.getElementById('booking-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('btn-book-submit');
  btn.textContent = 'Processing...'; btn.disabled = true;
  
  const payload = {
    schedule_id: parseInt(document.getElementById('booking-schedule-id').value),
    travel_date: document.getElementById('book-date').value,
    full_name: document.getElementById('book-name').value,
    contact_number: document.getElementById('book-contact').value,
    passenger_type: selectedPassengerType
  };

  // ✅ Updated endpoint
  const res = await api.post('/api/bookings', payload);

  btn.textContent = 'Confirm Booking'; btn.disabled = false;
  if (res.ok) { showToast('Booking confirmed! 🎉', 'success'); showBookingSuccess(res.data); }
  else { showToast(res.error, 'error'); }
});

function showBookingSuccess(data) {
  document.getElementById('success-booking-code').textContent = data.booking_code;
  document.getElementById('success-fare').textContent = `₱${parseFloat(data.total_fare).toFixed(2)}`;
  document.getElementById('success-qr').src = data.qr_code;
  router.navigate('page-booking-success');
}

// ===== MY BOOKINGS =====
async function loadMyBookings() {
  if (!api.isLoggedIn()) { router.navigate('page-auth'); return; }
  const list = document.getElementById('my-bookings-list');
  list.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';
  
  // ✅ Updated endpoint
  const res = await api.get('/api/bookings/my');
  if (!res.ok) { list.innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div><h3>Failed to load</h3></div>'; return; }
  if (res.data.length === 0) {
    list.innerHTML = '<div class="empty-state"><div class="empty-icon">🎫</div><h3>No bookings yet</h3><p>Book your first ferry ride!</p></div>'; return;
  }
  list.innerHTML = res.data.map(b => `
    <div class="booking-card" onclick="showBookingDetail(${b.id})">
      <div class="booking-card-header">
        <span class="booking-id">${b.booking_code}</span>
        <span class="status-badge ${b.status}">${b.status.replace('_', ' ')}</span>
      </div>
      <div class="booking-card-body">
        <div class="booking-route">${b.route_name}</div>
        <div class="booking-details">
          🚢 ${b.shipping_line_name} • ${b.ship_name}<br>
          📅 ${formatDate(b.travel_date)} • ${formatTime(b.departure_time)}<br>
          👤 ${b.passenger_type.replace('_', ' ')}
        </div>
        <div class="booking-fare">
          <span class="booking-fare-label">Total Fare</span>
          <span class="booking-fare-amount">₱${parseFloat(b.total_fare).toFixed(2)}</span>
        </div>
      </div>
    </div>`).join('');
}

async function showBookingDetail(id) {
  // ✅ Updated endpoint
  const res = await api.get(`/api/bookings/my/${id}`);
  if (!res.ok) { showToast('Failed to load booking', 'error'); return; }
  const b = res.data;
  document.getElementById('detail-code').textContent = b.booking_code;
  document.getElementById('detail-status').className = `status-badge ${b.status}`;
  document.getElementById('detail-status').textContent = b.status.replace('_', ' ');
  document.getElementById('detail-route').textContent = b.route_name;
  document.getElementById('detail-line').textContent = b.shipping_line_name;
  document.getElementById('detail-ship').textContent = b.ship_name;
  document.getElementById('detail-date').textContent = formatDate(b.travel_date);
  document.getElementById('detail-depart').textContent = formatTime(b.departure_time);
  document.getElementById('detail-arrive').textContent = formatTime(b.arrival_time);
  document.getElementById('detail-pax').textContent = b.passenger_type.replace('_',' ');
  document.getElementById('detail-fare').textContent = `₱${parseFloat(b.total_fare).toFixed(2)}`;
  document.getElementById('detail-qr').src = b.qr_code;
  router.navigate('page-booking-detail');
}

// ===== PROFILE =====
function loadProfile() {
  const user = api.getUser();
  if (!user) { router.navigate('page-auth'); return; }
  document.getElementById('profile-name').textContent = user.full_name;
  document.getElementById('profile-email').textContent = user.email;
  document.getElementById('profile-contact').textContent = user.contact_number || 'Not set';
}

function logout() {
  localStorage.removeItem('bf_token');
  localStorage.removeItem('bf_user');
  showToast('Logged out successfully');
  router.navigate('page-auth');
}

// ===== BOTTOM NAV =====
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.nav-item');
  if (!btn) return;
  const id = btn.id;
  if (id === 'nav-home')      { router.navigate('page-home');      loadHome(); }
  if (id === 'nav-schedules') { router.navigate('page-schedules'); loadSchedules(); }
  if (id === 'nav-bookings')  { router.navigate('page-bookings');  loadMyBookings(); }
  if (id === 'nav-profile')   { router.navigate('page-profile');   loadProfile(); }
});

// ===== UTILS =====
function formatTime(t) {
  if (!t) return '';
  const parts = t.split(':');
  let h = parseInt(parts[0]), m = parts[1];
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}
function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}