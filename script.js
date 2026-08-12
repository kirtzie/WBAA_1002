/* ============================================
   VASTRA — interactions
   ============================================ */

// ---- WhatsApp number (digits only, with country code, no + or spaces) ----
const WHATSAPP_NUMBER = "447823590526";

// ---- Supabase config ----
// Fill these in from your Supabase project: Settings -> API
const SUPABASE_URL = "https://wxjeaqczctoyflwdxime.supabase.co"; // e.g. https://xxxxxxxx.supabase.co
const SUPABASE_ANON_KEY = "sb_publishable_ewMHUtcn6zBRc2QW-rzleQ_SaT0_LI_"; // the "anon public" key, safe for browser use

let supabaseClient = null;
if (
  window.supabase &&
  SUPABASE_URL &&
  SUPABASE_ANON_KEY &&
  !SUPABASE_URL.includes("YOUR_SUPABASE") &&
  !SUPABASE_ANON_KEY.includes("YOUR_SUPABASE")
) {
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
  console.warn("Supabase not configured — enquiries will only go via WhatsApp, not saved to a database. Fill in SUPABASE_URL and SUPABASE_ANON_KEY in script.js.");
}

// ============================================
// AUTH (Supabase) — login / signup / logout
// ============================================
const authModal = document.getElementById("authModal");
const authBackdrop = document.getElementById("authBackdrop");
const authClose = document.getElementById("authClose");
const accountBtn = document.getElementById("accountBtn");
const accountBtnLabel = document.getElementById("accountBtnLabel");
const accountBtnMobile = document.getElementById("accountBtnMobile");

const authView = document.getElementById("authView");
const accountView = document.getElementById("accountView");
const accountEmail = document.getElementById("accountEmail");
const logoutBtn = document.getElementById("logoutBtn");

const authTabs = document.querySelectorAll(".modal__tab");
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const authNote = document.getElementById("authNote");
const authTitle = document.getElementById("authTitle");

const forgotView = document.getElementById("forgotView");
const forgotForm = document.getElementById("forgotForm");
const forgotNote = document.getElementById("forgotNote");
const forgotPasswordLink = document.getElementById("forgotPasswordLink");
const backToLoginLink = document.getElementById("backToLoginLink");

const resetView = document.getElementById("resetView");
const resetForm = document.getElementById("resetForm");
const resetNote = document.getElementById("resetNote");

// Single place that controls which of the modal's five views is visible:
// login, signup, forgot (request reset email), reset (set new password), account.
function showAuthState(state) {
  authView.hidden = !(state === "login" || state === "signup");
  forgotView.hidden = state !== "forgot";
  resetView.hidden = state !== "reset";
  accountView.hidden = state !== "account";
  if (state === "login" || state === "signup") {
    authTabs.forEach((t) => t.classList.toggle("is-active", t.dataset.tab === state));
    loginForm.hidden = state !== "login";
    signupForm.hidden = state !== "signup";
    authTitle.textContent = state === "login" ? "Welcome back" : "Create your account";
    authNote.textContent = "";
  }
}

function openAuthModal() {
  authModal.classList.add("is-open");
  authModal.setAttribute("aria-hidden", "false");
  authNote.textContent = "";
}
function closeAuthModal() {
  authModal.classList.remove("is-open");
  authModal.setAttribute("aria-hidden", "true");
}

if (accountBtn) accountBtn.addEventListener("click", async () => {
  if (!supabaseClient) {
    openAuthModal();
    authNote.style.color = "#E08A8A";
    authNote.textContent = "Auth isn't set up yet — add your Supabase keys in script.js.";
    return;
  }
  const { data } = await supabaseClient.auth.getSession();
  if (data.session) {
    accountEmail.textContent = data.session.user.email;
    showAuthState("account");
  } else {
    showAuthState("login");
  }
  openAuthModal();
});
if (accountBtnMobile) accountBtnMobile.addEventListener("click", (e) => {
  e.preventDefault();
  burger.classList.remove("is-open");
  mobileMenu.classList.remove("is-open");
  accountBtn.click();
});

authBackdrop.addEventListener("click", closeAuthModal);
authClose.addEventListener("click", closeAuthModal);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && authModal.classList.contains("is-open")) closeAuthModal();
});

authTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    showAuthState(tab.dataset.tab);
    // Clear any validation state left over from the other form
    [loginFields, signupFields].forEach((group) => {
      Object.values(group).forEach((f) => {
        f.error.textContent = "";
        f.input.classList.remove("is-invalid");
      });
    });
  });
});

forgotPasswordLink.addEventListener("click", () => {
  showAuthState("forgot");
  forgotNote.textContent = "";
});
backToLoginLink.addEventListener("click", () => {
  showAuthState("login");
});

// ---- Field-level validation (mirrors the enquiry form's pattern) ----
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Catches common domain typos (e.g. "gmail.comm", "gmial.com") that pass
// basic email regex but are almost certainly mistakes.
const KNOWN_DOMAINS = [
  "gmail.com", "yahoo.com", "hotmail.com", "outlook.com",
  "icloud.com", "rediffmail.com", "protonmail.com", "live.com",
];
function levenshtein(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[a.length][b.length];
}
function suggestedDomain(domain) {
  const d = domain.toLowerCase();
  for (const known of KNOWN_DOMAINS) {
    if (d !== known && levenshtein(d, known) <= 1) return known;
  }
  return null;
}
function validateEmailValue(value) {
  const v = value.trim();
  if (!v) return "Please enter your email.";
  if (!EMAIL_RE.test(v)) return "Enter a valid email address.";
  const domain = v.split("@")[1] || "";
  const suggestion = suggestedDomain(domain);
  if (suggestion) return `Check your email — did you mean @${suggestion}?`;
  return "";
}

const loginFields = {
  loginEmail: {
    input: document.getElementById("loginEmail"),
    error: document.getElementById("err-loginEmail"),
    validate: validateEmailValue,
  },
  loginPassword: {
    input: document.getElementById("loginPassword"),
    error: document.getElementById("err-loginPassword"),
    validate(value) {
      if (!value) return "Please enter your password.";
      return "";
    },
  },
};

const signupFields = {
  signupName: {
    input: document.getElementById("signupName"),
    error: document.getElementById("err-signupName"),
    validate(value) {
      const v = value.trim();
      if (!v) return "Please enter your name.";
      if (v.length < 2) return "Name looks too short.";
      if (!/^[a-zA-Z\s.'-]+$/.test(v)) return "Please use letters only.";
      return "";
    },
  },
  signupEmail: {
    input: document.getElementById("signupEmail"),
    error: document.getElementById("err-signupEmail"),
    validate: validateEmailValue,
  },
  signupPassword: {
    input: document.getElementById("signupPassword"),
    error: document.getElementById("err-signupPassword"),
    validate(value) {
      if (!value) return "Please create a password.";
      if (value.length < 6) return "Use at least 6 characters.";
      return "";
    },
  },
};

function validateAuthField(group, key) {
  const field = group[key];
  const message = field.validate(field.input.value);
  field.error.textContent = message;
  field.input.classList.toggle("is-invalid", Boolean(message));
  return !message;
}

[loginFields, signupFields].forEach((group) => {
  Object.keys(group).forEach((key) => {
    const field = group[key];
    field.input.addEventListener("blur", () => validateAuthField(group, key));
    field.input.addEventListener("input", () => {
      if (field.input.classList.contains("is-invalid")) validateAuthField(group, key);
    });
  });
});

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const results = Object.keys(loginFields).map((key) => validateAuthField(loginFields, key));
  if (!results.every(Boolean)) {
    authNote.style.color = "#E08A8A";
    authNote.textContent = "Please fix the fields marked in red.";
    return;
  }
  if (!supabaseClient) {
    authNote.style.color = "#E08A8A";
    authNote.textContent = "Login isn't set up yet — add your Supabase keys in script.js.";
    return;
  }
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  const btn = loginForm.querySelector("button");
  btn.disabled = true;
  authNote.style.color = "";
  authNote.textContent = "Logging in...";
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  btn.disabled = false;
  if (error) {
    authNote.style.color = "#E08A8A";
    authNote.textContent = error.message === "Invalid login credentials"
      ? "Incorrect email or password."
      : error.message;
    return;
  }
  authNote.style.color = "";
  authNote.textContent = "";
  accountEmail.textContent = data.user.email;
  showAuthState("account");
  loginForm.reset();
});

signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const results = Object.keys(signupFields).map((key) => validateAuthField(signupFields, key));
  if (!results.every(Boolean)) {
    authNote.style.color = "#E08A8A";
    authNote.textContent = "Please fix the fields marked in red.";
    return;
  }
  if (!supabaseClient) {
    authNote.style.color = "#E08A8A";
    authNote.textContent = "Sign up isn't set up yet — add your Supabase keys in script.js.";
    return;
  }
  const fullName = document.getElementById("signupName").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value;
  const btn = signupForm.querySelector("button");
  btn.disabled = true;
  authNote.style.color = "";
  authNote.textContent = "Creating your account...";
  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
  btn.disabled = false;
  if (error) {
    authNote.style.color = "#E08A8A";
    authNote.textContent = error.message;
    return;
  }
  // Supabase returns a "user" with an empty identities[] array (no error)
  // when the email is already registered — this is how it avoids leaking
  // which emails exist. Catch that case and point them to Log In instead.
  if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    authNote.style.color = "#E08A8A";
    authNote.textContent = "This email is already registered — try logging in instead.";
    return;
  }
  // If email confirmation is ON in Supabase, there's no session yet.
  if (!data.session) {
    authNote.style.color = "";
    authNote.textContent = "Check your email to confirm your account, then log in.";
    signupForm.reset();
    return;
  }
  authNote.textContent = "";
  accountEmail.textContent = data.user.email;
  showAuthState("account");
  signupForm.reset();
});

logoutBtn.addEventListener("click", async () => {
  if (!supabaseClient) return;
  await supabaseClient.auth.signOut();
  closeAuthModal();
});

// ---- Forgot password: send reset email ----
const forgotFields = {
  forgotEmail: {
    input: document.getElementById("forgotEmail"),
    error: document.getElementById("err-forgotEmail"),
    validate: validateEmailValue,
  },
};
Object.keys(forgotFields).forEach((key) => {
  const field = forgotFields[key];
  field.input.addEventListener("blur", () => validateAuthField(forgotFields, key));
  field.input.addEventListener("input", () => {
    if (field.input.classList.contains("is-invalid")) validateAuthField(forgotFields, key);
  });
});

forgotForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const valid = validateAuthField(forgotFields, "forgotEmail");
  if (!valid) {
    forgotNote.style.color = "#E08A8A";
    forgotNote.textContent = "Please fix the email above.";
    return;
  }
  if (!supabaseClient) {
    forgotNote.style.color = "#E08A8A";
    forgotNote.textContent = "Auth isn't set up yet — add your Supabase keys in script.js.";
    return;
  }
  const email = document.getElementById("forgotEmail").value.trim();
  const btn = forgotForm.querySelector("button[type=submit]");
  btn.disabled = true;
  forgotNote.style.color = "";
  forgotNote.textContent = "Sending reset link...";
  const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + window.location.pathname,
  });
  btn.disabled = false;
  if (error) {
    forgotNote.style.color = "#E08A8A";
    forgotNote.textContent = error.message;
    return;
  }
  // Supabase doesn't reveal whether the email exists (avoids account
  // enumeration) — this message is accurate either way.
  forgotNote.style.color = "";
  forgotNote.textContent = "If that email has an account, a reset link is on its way.";
  forgotForm.reset();
});

// ---- Reset password: set new password (arrives via the emailed link) ----
const resetFields = {
  resetPassword: {
    input: document.getElementById("resetPassword"),
    error: document.getElementById("err-resetPassword"),
    validate(value) {
      if (!value) return "Please enter a new password.";
      if (value.length < 6) return "Use at least 6 characters.";
      return "";
    },
  },
  resetPasswordConfirm: {
    input: document.getElementById("resetPasswordConfirm"),
    error: document.getElementById("err-resetPasswordConfirm"),
    validate(value) {
      if (!value) return "Please confirm your new password.";
      if (value !== document.getElementById("resetPassword").value) return "Passwords don't match.";
      return "";
    },
  },
};
Object.keys(resetFields).forEach((key) => {
  const field = resetFields[key];
  field.input.addEventListener("blur", () => validateAuthField(resetFields, key));
  field.input.addEventListener("input", () => {
    if (field.input.classList.contains("is-invalid")) validateAuthField(resetFields, key);
  });
});

resetForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const results = Object.keys(resetFields).map((key) => validateAuthField(resetFields, key));
  if (!results.every(Boolean)) {
    resetNote.style.color = "#E08A8A";
    resetNote.textContent = "Please fix the fields marked in red.";
    return;
  }
  if (!supabaseClient) return;
  const password = document.getElementById("resetPassword").value;
  const btn = resetForm.querySelector("button");
  btn.disabled = true;
  resetNote.style.color = "";
  resetNote.textContent = "Updating password...";
  const { error } = await supabaseClient.auth.updateUser({ password });
  btn.disabled = false;
  if (error) {
    resetNote.style.color = "#E08A8A";
    resetNote.textContent = error.message;
    return;
  }
  resetNote.style.color = "";
  resetNote.textContent = "Password updated. You're all set.";
  resetForm.reset();
  // Clear the recovery token out of the URL and drop them into their account view.
  history.replaceState(null, "", window.location.pathname);
  setTimeout(async () => {
    const { data } = await supabaseClient.auth.getSession();
    if (data.session) accountEmail.textContent = data.session.user.email;
    showAuthState("account");
  }, 1200);
});

// Keep the nav button label in sync with the current session, react to
// login/signup/logout anywhere on the page, and catch the moment a visitor
// arrives via a password-reset email link.
async function refreshAccountUI() {
  if (!supabaseClient) return;
  const { data } = await supabaseClient.auth.getSession();
  const label = data.session ? data.session.user.email.split("@")[0] : "Log In";
  if (accountBtnLabel) accountBtnLabel.textContent = label;
  if (accountBtnMobile) accountBtnMobile.textContent = data.session ? label : "Log In";
}
if (supabaseClient) {
  refreshAccountUI();
  supabaseClient.auth.onAuthStateChange((event) => {
    refreshAccountUI();
    if (event === "PASSWORD_RECOVERY") {
      showAuthState("reset");
      openAuthModal();
    }
  });
}

// ---- Footer year ----
document.getElementById("year").textContent = new Date().getFullYear();

// ---- Nav scroll state ----
const nav = document.getElementById("nav");
window.addEventListener("scroll", () => {
  nav.classList.toggle("is-scrolled", window.scrollY > 20);
}, { passive: true });

// ---- Mobile menu ----
const burger = document.getElementById("burger");
const mobileMenu = document.getElementById("mobileMenu");
burger.addEventListener("click", () => {
  const open = burger.classList.toggle("is-open");
  mobileMenu.classList.toggle("is-open", open);
});
mobileMenu.querySelectorAll("a").forEach(a => {
  a.addEventListener("click", () => {
    burger.classList.remove("is-open");
    mobileMenu.classList.remove("is-open");
  });
});

// ---- Ambient particles in hero ----
const particleField = document.getElementById("particles");
const PARTICLE_COUNT = 26;
for (let i = 0; i < PARTICLE_COUNT; i++) {
  const p = document.createElement("span");
  p.style.left = Math.random() * 100 + "%";
  p.style.bottom = "-10px";
  const duration = 10 + Math.random() * 14;
  const delay = Math.random() * 14;
  const size = 1.5 + Math.random() * 2.5;
  p.style.width = size + "px";
  p.style.height = size + "px";
  p.style.animationDuration = duration + "s";
  p.style.animationDelay = "-" + delay + "s";
  particleField.appendChild(p);
}

// ---- 3D tilt: The Vitrine (hero signature element) ----
const vitrine = document.getElementById("vitrine");
const stage = document.querySelector(".hero__stage");
if (vitrine && stage && matchMedia("(pointer: fine)").matches) {
  stage.addEventListener("mousemove", (e) => {
    const rect = stage.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    const rotY = 6 - x * 22;
    const rotX = 6 + y * 16;
    vitrine.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
  });
  stage.addEventListener("mouseleave", () => {
    vitrine.style.transform = "rotateX(6deg) rotateY(-10deg)";
  });
}

// ---- 3D tilt: collection cards ----
document.querySelectorAll("[data-tilt]").forEach((card) => {
  if (!matchMedia("(pointer: fine)").matches) return;
  card.addEventListener("mousemove", (e) => {
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `rotateX(${(-y * 8).toFixed(2)}deg) rotateY(${(x * 8).toFixed(2)}deg) translateY(-4px)`;
  });
  card.addEventListener("mouseleave", () => {
    card.style.transform = "rotateX(0deg) rotateY(0deg) translateY(0)";
  });
});

// ---- Scroll-reveal for sections ----
const revealTargets = document.querySelectorAll(".section, .card");
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = "1";
      entry.target.style.transform = "translateY(0)";
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

revealTargets.forEach((el) => {
  el.style.opacity = "0";
  el.style.transform = "translateY(24px)";
  el.style.transition = "opacity 0.8s ease, transform 0.8s ease";
  revealObserver.observe(el);
});
// Undo the reveal effect on the enquiry form's parent so the form itself stays put visually
// (kept subtle — only fade, no upward shift, for the enquire section head)

// ============================================
// FORM VALIDATION + WHATSAPP HANDOFF
// ============================================
const form = document.getElementById("enquiryForm");
const formNote = document.getElementById("formNote");

const fields = {
  fullName: {
    input: document.getElementById("fullName"),
    error: document.getElementById("err-fullName"),
    validate(value) {
      const v = value.trim();
      if (!v) return "Please enter your name.";
      if (v.length < 2) return "Name looks too short.";
      if (!/^[a-zA-Z\s.'-]+$/.test(v)) return "Please use letters only.";
      return "";
    },
  },
  phone: {
    input: document.getElementById("phone"),
    error: document.getElementById("err-phone"),
    validate(value) {
      const v = value.trim();
      if (!v) return "Please enter a phone number.";
      const digits = v.replace(/[^0-9]/g, "");
      if (digits.length < 10 || digits.length > 13) {
        return "Enter a valid number with country/area code.";
      }
      if (!/^[0-9+\s-]+$/.test(v)) return "Numbers, spaces and + only.";
      return "";
    },
  },
  message: {
    input: document.getElementById("message"),
    error: document.getElementById("err-message"),
    validate(value) {
      const v = value.trim();
      if (!v) return "Tell us a little about what you need.";
      if (v.length < 10) return "A few more details would help (10+ characters).";
      return "";
    },
  },
};

function validateField(key) {
  const field = fields[key];
  const message = field.validate(field.input.value);
  field.error.textContent = message;
  field.input.classList.toggle("is-invalid", Boolean(message));
  return !message;
}

Object.keys(fields).forEach((key) => {
  const field = fields[key];
  field.input.addEventListener("blur", () => validateField(key));
  field.input.addEventListener("input", () => {
    if (field.input.classList.contains("is-invalid")) validateField(key);
  });
});

const submitBtn = form.querySelector(".form__submit");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const results = Object.keys(fields).map((key) => validateField(key));
  const isValid = results.every(Boolean);

  if (!isValid) {
    formNote.textContent = "Please fix the fields marked in red.";
    formNote.style.color = "#E08A8A";
    return;
  }

  const name = fields.fullName.input.value.trim();
  const phone = fields.phone.input.value.trim();
  const occasion = document.getElementById("occasion").value;
  const message = fields.message.input.value.trim();

  const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `New enquiry from VASTRA site\nName: ${name}\nPhone: ${phone}\nOccasion: ${occasion}\nMessage: ${message}`
  )}`;

  submitBtn.disabled = true;
  formNote.style.color = "";
  formNote.textContent = "Sending...";

  // Save to Supabase first (if configured), so the enquiry is never lost
  // even if the visitor closes the tab instead of tapping Send in WhatsApp.
  if (supabaseClient) {
    try {
      const { error } = await supabaseClient.from("enquiries").insert([
        {
          full_name: name,
          phone: phone,
          occasion: occasion,
          message: message,
        },
      ]);
      if (error) throw error;
    } catch (err) {
      console.error("Supabase insert failed:", err);
      formNote.style.color = "#E08A8A";
      formNote.textContent = "Couldn't save to our records, but continuing to WhatsApp...";
    }
  }

  formNote.style.color = "";
  formNote.textContent = "Opening WhatsApp — send the message to reach us.";

  window.open(waUrl, "_blank", "noopener");

  submitBtn.disabled = false;
  form.reset();
  Object.values(fields).forEach((f) => {
    f.error.textContent = "";
    f.input.classList.remove("is-invalid");
  });
});
