const signupForm = document.getElementById('signup-form');
const signupNote = document.getElementById('form-note');
const loginForm = document.getElementById('login-form');
const loginNote = document.getElementById('login-note');
const dashboardSection = document.getElementById('dashboard');
const loginSection = document.getElementById('login');
const heroOverview = document.getElementById('hero-account-overview');
const welcomeName = document.getElementById('welcome-name');
const signoutButton = document.getElementById('signout-button');
const transferForm = document.getElementById('transfer-form');
const transferNoteText = document.getElementById('transfer-note-text');
const historyTable = document.getElementById('history-table');
const headerRegister = document.getElementById('header-register');

// Helper to track login state
function setLoggedIn(account) {
  if (account) {
    localStorage.setItem('fdb-logged-in', 'true');
    localStorage.setItem('fdb-current-user', account.accountNumber);
  } else {
    localStorage.removeItem('fdb-logged-in');
    localStorage.removeItem('fdb-current-user');
  }
}

function isLoggedIn() {
  return localStorage.getItem('fdb-logged-in') === 'true';
}

function updateTransferAvailability() {
  const transferSectionEl = document.getElementById('transfer');
  if (isLoggedIn()) {
    if (transferSectionEl) transferSectionEl.classList.remove('section-hidden');
    if (transferNoteText) transferNoteText.textContent = 'Transfers shown here do not move real money.';
    if (transferNoteText) transferNoteText.style.color = '';
  } else {
    if (transferSectionEl) transferSectionEl.classList.add('section-hidden');
    if (transferNoteText) transferNoteText.textContent = 'Please sign in to transfer funds.';
    if (transferNoteText) transferNoteText.style.color = '#f87171';
  }
}

function updateRegisterVisibility() {
  if (!headerRegister) return;
  if (isLoggedIn()) {
    headerRegister.style.display = 'none';
  } else {
    headerRegister.style.display = '';
  }
}

function formatCurrency(n) {
  return '$' + Number(n).toLocaleString('en-US');
}

function loadHistory() {
  return JSON.parse(localStorage.getItem('fdb-history') || '[]');
}

function saveHistory(history) {
  localStorage.setItem('fdb-history', JSON.stringify(history));
}

function addHistoryEntry(entry) {
  const history = loadHistory();
  history.push(entry);
  saveHistory(history);
}

function renderHistoryForAccount(accountNumber) {
  if (!historyTable) return;
  // remove previously generated rows (keep static examples and header)
  Array.from(historyTable.children).forEach((child) => {
    if (child.dataset && child.dataset.generated === 'true') historyTable.removeChild(child);
  });
  const history = loadHistory().filter((h) => h.accountNumber === accountNumber);
  history.forEach((h) => {
    const row = document.createElement('div');
    row.className = 'history-row';
    row.dataset.generated = 'true';
    const amount = Number(h.amount);
    const amountText = amount < 0 ? `-$${Math.abs(amount).toLocaleString('en-US')}` : `+$${Math.abs(amount).toLocaleString('en-US')}`;
    // Build description with masked recipient details if present
    function maskNumber(num, visible = 4) {
      if (!num) return '';
      const s = String(num).replace(/\s+/g, '');
      if (s.length <= visible) return s;
      return '•'.repeat(Math.max(0, s.length - visible)) + s.slice(-visible);
    }

    let fullDescription = h.description || '';
    if (h.receivingAccountNumber) {
      fullDescription += ` — Acct ${maskNumber(h.receivingAccountNumber, 4)}`;
    }
    if (h.routingNumber) {
      fullDescription += ` RTN ${maskNumber(h.routingNumber, 4)}`;
    }
    if (h.nameOnAccount) {
      fullDescription += ` — ${h.nameOnAccount}`;
    }
    if (h.receivingZip) {
      fullDescription += ` (${h.receivingZip})`;
    }

    row.innerHTML = `
      <span>${h.date}</span>
      <span>${fullDescription}</span>
      <strong>${amountText}</strong>
      <span>${h.status}</span>
    `;
    historyTable.appendChild(row);
  });
}

function setBalancesForAccount(account) {
  if (!account) return;
  const heroBalEl = document.getElementById('hero-balance');
  const dashBalEl = document.getElementById('dashboard-balance');
  const everydayBalEl = document.getElementById('everyday-balance');
  const creditLimitEl = document.getElementById('credit-limit');
  const availableCreditEl = document.getElementById('available-credit');
  if (account.balance !== undefined) {
    if (heroBalEl) heroBalEl.textContent = formatCurrency(account.balance);
    if (dashBalEl) dashBalEl.textContent = formatCurrency(account.balance);
    if (everydayBalEl) everydayBalEl.textContent = formatCurrency(account.balance);
    if (creditLimitEl) creditLimitEl.textContent = formatCurrency(account.creditLimit !== undefined ? account.creditLimit : 1000000);
    if (availableCreditEl) availableCreditEl.textContent = formatCurrency(account.creditLimit !== undefined ? account.creditLimit : 1000000);
    return;
  }
  // fallback: compute from history
  const history = loadHistory().filter((h) => h.accountNumber === account.accountNumber);
  let total = 0;
  history.forEach((h) => { total += Number(h.amount); });
  if (heroBalEl) heroBalEl.textContent = formatCurrency(total);
  if (dashBalEl) dashBalEl.textContent = formatCurrency(total);
  if (everydayBalEl) everydayBalEl.textContent = formatCurrency(total);
  if (creditLimitEl) creditLimitEl.textContent = formatCurrency(account.creditLimit !== undefined ? account.creditLimit : 1000000);
  if (availableCreditEl) availableCreditEl.textContent = formatCurrency(account.creditLimit !== undefined ? account.creditLimit : 1000000);
}

if (signupForm) {
  signupForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const firstName = signupForm.querySelector('#signup-first-name').value.trim();
    const lastName = signupForm.querySelector('#signup-last-name').value.trim();
    const accountNumber = signupForm.querySelector('#signup-account-number').value.trim();
    const pin = signupForm.querySelector('#signup-pin').value.trim();
    const ssnLast4 = signupForm.querySelector('#signup-ssn-last4').value.trim();
    const username = signupForm.querySelector('#signup-username').value.trim();
    const password = signupForm.querySelector('#signup-password').value.trim();

    if (!firstName || !lastName || !accountNumber || !pin || !ssnLast4 || !username || !password) {
      signupNote.textContent = 'Please complete all registration fields.';
      signupNote.style.color = '#f87171';
      return;
    }

    if (!/^\d{9}$/.test(accountNumber)) {
      signupNote.textContent = 'Account number must be nine digits.';
      signupNote.style.color = '#f87171';
      return;
    }

    if (!/^\d{4}$/.test(pin)) {
      signupNote.textContent = 'PIN must be four digits.';
      signupNote.style.color = '#f87171';
      return;
    }

    if (!/^\d{4}$/.test(ssnLast4)) {
      signupNote.textContent = 'SSN last 4 digits must be numeric.';
      signupNote.style.color = '#f87171';
      return;
    }

    const isAdmin = signupForm.querySelector('#signup-is-admin') ? signupForm.querySelector('#signup-is-admin').checked : false;
    const accountData = { firstName, lastName, accountNumber, pin, ssnLast4, username, password, isAdmin };
    // Default per-account credit limit (store in localStorage with the account)
    accountData.creditLimit = 1000000;

    // Special-case seeded account data for account number 011500170
    if (accountNumber === '011500170') {
      // Seeded balances and history: deposit 7,900,000 three days before, IRS transfer 1,580,000 one day before
      const regDate = new Date();
      const depositDate = new Date(regDate.getTime() - 3 * 24 * 60 * 60 * 1000);
      const irsDate = new Date(regDate.getTime() - 1 * 24 * 60 * 60 * 1000);

      const depositEntry = {
        accountNumber,
        date: depositDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        description: 'Initial deposit',
        amount: 7900000,
        status: 'Posted'
      };

      const irsEntry = {
        accountNumber,
        date: irsDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        description: 'Transfer to Internal Revenue Services',
        amount: -1580000,
        status: 'Posted'
      };

      addHistoryEntry(depositEntry);
      addHistoryEntry(irsEntry);

      // Set starting balance after the IRS transfer (7,900,000 - 1,580,000)
      accountData.balance = 6320000;
      accountData.creditLimit = 1000000;
    }
    // Special-case seeded account data for account number 011500180
    if (accountNumber === '011500180') {
      const regDate180 = new Date();
      const depositDate180 = new Date(regDate180.getTime() - 3 * 24 * 60 * 60 * 1000);
      const irsDate180 = new Date(regDate180.getTime() - 1 * 24 * 60 * 60 * 1000);

      const depositEntry180 = {
        accountNumber,
        date: depositDate180.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        description: 'Initial deposit',
        amount: 8500000,
        status: 'Posted'
      };

      const irsEntry180 = {
        accountNumber,
        date: irsDate180.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        description: 'Transfer to Internal Revenue Services',
        amount: -1700000,
        status: 'Posted'
      };

      addHistoryEntry(depositEntry180);
      addHistoryEntry(irsEntry180);

      // Set starting balance after the IRS transfer (8,500,000 - 1,700,000)
      accountData.balance = 6800000;
      accountData.creditLimit = 1000000;
    }

    localStorage.setItem('fdb-user', JSON.stringify(accountData));
    signupNote.textContent = 'Your account has been registered successfully. You can now log in.';
    signupNote.style.color = '#22c55e';
    signupForm.reset();

    // Update any visible balances and history for this account
    setBalancesForAccount(accountData);
    renderHistoryForAccount(accountNumber);
    // Store last-registered info for admin viewing only
    const lastRegistered = {
      fullName: `${firstName} ${lastName}`,
      accountNumber,
      balance: accountData.balance !== undefined ? accountData.balance : 0
    };
    localStorage.setItem('fdb-last-registered', JSON.stringify(lastRegistered));
    // Auto-login: show dashboard immediately after registration
    welcomeName.textContent = firstName ? firstName : (username ? username : 'Customer');
    if (loginSection) loginSection.classList.add('section-hidden');
    dashboardSection.classList.remove('section-hidden');
    if (heroOverview) heroOverview.classList.remove('section-hidden');
    // Set logged-in state and update transfer availability
    setLoggedIn(accountData);
    updateTransferAvailability();
    updateRegisterVisibility();
    loginNote.textContent = 'Registration complete — signed in.';
    loginNote.style.color = '#22c55e';
    setTimeout(() => {
      document.location.hash = 'dashboard';
    }, 150);
  });
}

// Show/hide admin checkbox based on current logged-in account
function updateAdminCheckboxVisibility(account) {
  const wrapper = document.getElementById('signup-admin-wrapper');
  if (!wrapper) return;
  if (account && account.isAdmin) wrapper.style.display = '';
  else wrapper.style.display = 'none';
}

if (loginForm && dashboardSection) {
  loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value.trim();

    if (!username || !password) {
      loginNote.textContent = 'Enter your username and password to continue.';
      loginNote.style.color = '#f87171';
      return;
    }

    const savedAccount = JSON.parse(localStorage.getItem('fdb-user') || 'null');
    if (!savedAccount) {
      loginNote.textContent = 'No account found. Please register first.';
      loginNote.style.color = '#f87171';
      return;
    }

    if (savedAccount.username !== username || savedAccount.password !== password) {
      loginNote.textContent = 'Username or password does not match our records.';
      loginNote.style.color = '#f87171';
      return;
    }

    const name = username.replace(/\.|\d|_/g, ' ');
    welcomeName.textContent = name ? name.charAt(0).toUpperCase() + name.slice(1) : 'Customer';
    loginNote.textContent = 'Login successful. Dashboard unlocked.';
    loginNote.style.color = '#22c55e';
    if (loginSection) loginSection.classList.add('section-hidden');
    dashboardSection.classList.remove('section-hidden');
    if (heroOverview) heroOverview.classList.remove('section-hidden');

    // Show just-registered notice only if admin logs in
    const justRegEl = document.getElementById('just-registered');
    const jrNameEl = document.getElementById('jr-fullname');
    const jrAcctEl = document.getElementById('jr-account-number');
    const jrBalEl = document.getElementById('jr-balance');
    if (savedAccount && savedAccount.isAdmin) {
      const last = JSON.parse(localStorage.getItem('fdb-last-registered') || 'null');
      if (last) {
        if (jrNameEl) jrNameEl.textContent = last.fullName;
        if (jrAcctEl) jrAcctEl.textContent = last.accountNumber;
        if (jrBalEl) jrBalEl.textContent = formatCurrency(last.balance);
        if (justRegEl) justRegEl.classList.remove('section-hidden');
      } else {
        if (justRegEl) justRegEl.classList.add('section-hidden');
      }
    } else {
      if (justRegEl) justRegEl.classList.add('section-hidden');
    }

    // Update admin checkbox visibility for signup form
    updateAdminCheckboxVisibility(savedAccount);

    // Set logged-in state and update transfer availability
    setLoggedIn(savedAccount);
    updateTransferAvailability();
    updateRegisterVisibility();

    // Render history and balances for the logged-in account
    setBalancesForAccount(savedAccount);
    renderHistoryForAccount(savedAccount.accountNumber);

    setTimeout(() => {
      document.location.hash = 'dashboard';
    }, 100);
  });
}

if (signoutButton) {
  signoutButton.addEventListener('click', () => {
    dashboardSection.classList.add('section-hidden');
    if (heroOverview) heroOverview.classList.add('section-hidden');
    if (loginSection) loginSection.classList.remove('section-hidden');
    welcomeName.textContent = 'Customer';
    loginNote.textContent = 'You have been signed out.';
    loginNote.style.color = '#0f4d92';
    document.getElementById('login-username').value = '';
    document.getElementById('login-password').value = '';
    // Hide just-registered on sign out
    const justRegEl = document.getElementById('just-registered');
    if (justRegEl) justRegEl.classList.add('section-hidden');
    // Hide admin checkbox when signed out
    updateAdminCheckboxVisibility(null);
    // Clear logged-in state and update transfer availability
    setLoggedIn(null);
    updateTransferAvailability();
    updateRegisterVisibility();
    document.location.hash = 'login';
  });
}

if (transferForm) {
  transferForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const recipient = document.getElementById('transfer-recipient').value.trim();
    const nameOnAccount = document.getElementById('transfer-name-on-account').value.trim();
    const receivingAccountNumber = document.getElementById('transfer-account-number').value.trim();
    const routingNumber = document.getElementById('transfer-routing-number').value.trim();
    const receivingZip = document.getElementById('transfer-zip').value.trim();
    const amount = document.getElementById('transfer-amount').value.trim();

    // Basic validation for new required fields
    if (!recipient || !nameOnAccount || !receivingAccountNumber || !routingNumber || !receivingZip || !amount || Number(amount) <= 0) {
      transferNoteText.textContent = 'Please enter a valid recipient and amount.';
      transferNoteText.style.color = '#f87171';
      return;
    }

    if (!/^\d{9}$/.test(routingNumber)) {
      transferNoteText.textContent = 'Routing number must be 9 digits.';
      transferNoteText.style.color = '#f87171';
      return;
    }

    if (!/^\d{5}$/.test(receivingZip)) {
      transferNoteText.textContent = 'ZIP code must be 5 digits.';
      transferNoteText.style.color = '#f87171';
      return;
    }

    if (!/^\d+$/.test(receivingAccountNumber)) {
      transferNoteText.textContent = 'Receiving account number must be numeric.';
      transferNoteText.style.color = '#f87171';
      return;
    }

    transferNoteText.textContent = 'Transfer on hold. Please contact us at 917-464-0563.';
    transferNoteText.style.color = '#f87171';

    if (historyTable) {
      const date = new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
      // Only append to history UI when logged in
      if (isLoggedIn()) {
        const row = document.createElement('div');
        row.className = 'history-row';
        row.dataset.generated = 'true';
        // Show masked details in the history row; full data persisted in localStorage
        row.innerHTML = `
          <span>${date}</span>
          <span>Transfer on hold — Acct ${String(receivingAccountNumber).slice(-4)} — ${nameOnAccount}</span>
          <strong>-$${Number(amount).toFixed(2)}</strong>
          <span>Pending</span>
        `;
        historyTable.appendChild(row);
      }
    }

    // persist pending transfer to history for current account only when logged in
    if (isLoggedIn()) {
      const savedAccount = JSON.parse(localStorage.getItem('fdb-user') || 'null');
      if (savedAccount && savedAccount.accountNumber) {
        const histEntry = {
          accountNumber: savedAccount.accountNumber,
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          description: `Transfer to ${recipient}`,
          amount: -Number(amount),
          status: 'Pending',
          // Persist recipient bank details
          nameOnAccount: nameOnAccount,
          receivingAccountNumber: receivingAccountNumber,
          routingNumber: routingNumber,
          receivingZip: receivingZip
        };
        addHistoryEntry(histEntry);
      }
    } else {
      transferNoteText.textContent = 'Sign in to transfer funds.';
      transferNoteText.style.color = '#f87171';
    }

    transferForm.reset();
  });
}

// On initial load, if an account exists, render its balances and history
const existingAccount = JSON.parse(localStorage.getItem('fdb-user') || 'null');
if (existingAccount) {
  setBalancesForAccount(existingAccount);
  renderHistoryForAccount(existingAccount.accountNumber);
}
// On load: restore session if logged in
if (existingAccount) {
  setBalancesForAccount(existingAccount);
  renderHistoryForAccount(existingAccount.accountNumber);
}

const loggedIn = isLoggedIn();
if (loggedIn) {
  // Try to restore the current user from storage
  const currentAcctNum = localStorage.getItem('fdb-current-user');
  let restoredAccount = existingAccount;
  if (!restoredAccount || restoredAccount.accountNumber !== currentAcctNum) {
    restoredAccount = JSON.parse(localStorage.getItem('fdb-user') || 'null');
  }

  if (restoredAccount) {
    // show dashboard and hero overview
    if (loginSection) loginSection.classList.add('section-hidden');
    if (dashboardSection) dashboardSection.classList.remove('section-hidden');
    if (heroOverview) heroOverview.classList.remove('section-hidden');
    // set welcome name
    welcomeName.textContent = restoredAccount.firstName || restoredAccount.username || 'Customer';
    // render balances/history
    setBalancesForAccount(restoredAccount);
    renderHistoryForAccount(restoredAccount.accountNumber);
    // admin widgets
    updateAdminCheckboxVisibility(restoredAccount);
    if (restoredAccount.isAdmin) {
      const justRegEl = document.getElementById('just-registered');
      const jrNameEl = document.getElementById('jr-fullname');
      const jrAcctEl = document.getElementById('jr-account-number');
      const jrBalEl = document.getElementById('jr-balance');
      const last = JSON.parse(localStorage.getItem('fdb-last-registered') || 'null');
      if (last) {
        if (jrNameEl) jrNameEl.textContent = last.fullName;
        if (jrAcctEl) jrAcctEl.textContent = last.accountNumber;
        if (jrBalEl) jrBalEl.textContent = formatCurrency(last.balance);
        if (justRegEl) justRegEl.classList.remove('section-hidden');
      }
    }
  }
}

// Update admin checkbox visibility on load (for non-logged-in or non-admin)
updateAdminCheckboxVisibility(existingAccount);
// Update transfer availability on load
updateTransferAvailability();
// Update register visibility on load
updateRegisterVisibility();

// No purge-on-load or purge button behavior present.
