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
    authView.hidden = true;
    accountView.hidden = false;
  } else {
    authView.hidden = false;
    accountView.hidden = true;
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
    authTabs.forEach((t) => t.classList.remove("is-active"));
    tab.classList.add("is-active");
    const isLogin = tab.dataset.tab === "login";
    loginForm.hidden = !isLogin;
    signupForm.hidden = isLogin;
    authTitle.textContent = isLogin ? "Welcome back" : "Create your account";
    authNote.textContent = "";
  });
});

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!supabaseClient) return;
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
    authNote.textContent = error.message;
    return;
  }
  authNote.style.color = "";
  authNote.textContent = "";
  accountEmail.textContent = data.user.email;
  authView.hidden = true;
  accountView.hidden = false;
  loginForm.reset();
});

signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!supabaseClient) return;
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
  // If email confirmation is ON in Supabase, there's no session yet.
  if (!data.session) {
    authNote.style.color = "";
    authNote.textContent = "Check your email to confirm your account, then log in.";
    signupForm.reset();
    return;
  }
  authNote.textContent = "";
  accountEmail.textContent = data.user.email;
  authView.hidden = true;
  accountView.hidden = false;
  signupForm.reset();
});

logoutBtn.addEventListener("click", async () => {
  if (!supabaseClient) return;
  await supabaseClient.auth.signOut();
  closeAuthModal();
});

// Keep the nav button label in sync with the current session,
// and react instantly to login/signup/logout anywhere on the page.
async function refreshAccountUI() {
  if (!supabaseClient) return;
  const { data } = await supabaseClient.auth.getSession();
  const label = data.session ? data.session.user.email.split("@")[0] : "Log In";
  if (accountBtnLabel) accountBtnLabel.textContent = label;
  if (accountBtnMobile) accountBtnMobile.textContent = data.session ? label : "Log In";
}
if (supabaseClient) {
  refreshAccountUI();
  supabaseClient.auth.onAuthStateChange(() => refreshAccountUI());
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
