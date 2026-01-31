import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === "signup" && password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      if (mode === "signin") {
        setError("Connection failed. Please check your credentials.");
      } else {
        setError("Account created successfully!");
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center px-4 sm:px-6 py-6 sm:py-8 md:py-12 relative bg-gradient-to-br from-white via-slate-50 to-slate-100 overflow-x-hidden">
      {/* Light Mode Toggle - Adjusted for mobile position */}
      <div className="absolute top-4 right-4 sm:top-8 sm:right-8 z-20">
        <button className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-slate-100 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-800 hover:bg-slate-50 transition-colors">
          <svg
            className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 7a5 5 0 100 10 5 5 0 000-10z"
            />
          </svg>
          <span className="hidden xs:inline">Light Mode</span>
          <span className="xs:hidden">Light</span>
        </button>
      </div>

      {/* Header / Logo */}
      <div className="text-center mb-6 md:mb-8 mt-4 sm:mt-0">
        <div className="inline-flex items-center justify-center w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-2xl shadow-lg mb-3 md:mb-4 text-white">
          <svg
            className="w-6 h-6 md:w-8 md:h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-[#5c6b73] mb-1">
          Orbital
        </h1>
        <p className="text-[9px] md:text-[10px] font-bold text-[#a4abb0] uppercase tracking-[0.3em] md:tracking-[0.4em]">
          Safe Remote Access
        </p>
      </div>

      {/* Login Card - Fully Responsive */}
      <div className="w-full max-w-[360px] sm:max-w-[40s0px] md:max-w-[450px] bg-white rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[3rem] shadow-[0_10px_30px_rgba(0,0,0,0.08)] sm:shadow-[0_20px_50px_rgba(0,0,0,0.05)] p-10 sm:p-14 md:p-18 lg:p-24 flex flex-col items-center min-h-[500px]">
        {/* Tab-like Badge */}
        <div className="bg-[#f3efff] px-4 sm:px-5 md:px-7 py-1 sm:py-1.5 md:py-2 rounded-full mb-9 sm:mb-11 md:mb-16">
          <span className="text-[8px] sm:text-[9px] md:text-[10px] font-bold text-violet-500 uppercase tracking-widest text-center block">
            {mode === "signin"
              ? "Sign In or Create Account"
              : "Register New Identity"}
          </span>
        </div>

        <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 mb-3 sm:mb-4 md:mb-5">
          {mode === "signin" ? "Sign In" : "Sign Up"}
        </h2>
        <p className="text-[11px] sm:text-xs md:text-sm font-medium text-slate-400 mb-8 sm:mb-10 md:mb-14 text-center px-2 sm:px-3">
          {mode === "signin"
            ? "Welcome back! Sign in to access your computers."
            : "Get started with Orbit. Create your secure identity."}
        </p>

        <form
          onSubmit={handleSubmit}
          className="w-full space-y-8 sm:space-y-9 md:space-y-12"
        >
          {error && (
            <div className="text-[8px] sm:text-[9px] md:text-xs font-bold text-rose-500 uppercase tracking-widest text-center bg-rose-50 p-4 sm:p-5 md:p-6 rounded-lg sm:rounded-xl border border-rose-100 animate-in fade-in slide-in-from-top-1">
              {error}
            </div>
          )}

          <div className="space-y-3 sm:space-y-4 md:space-y-5">
            <label className="block text-[8px] sm:text-[9px] md:text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest ml-1 sm:ml-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              className="w-full px-5 sm:px-6 py-3.5 sm:py-4 md:py-4.5 md:px-7 rounded-lg sm:rounded-xl md:rounded-2xl border border-slate-100 bg-[#fafafa] text-slate-700 font-medium text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-300 transition-all placeholder:text-slate-300 shadow-sm"
              required
            />
          </div>

          <div className="space-y-3 sm:space-y-4 md:space-y-5">
            <div className="flex justify-between items-center ml-1 sm:ml-1.5">
              <label className="block text-[8px] sm:text-[9px] md:text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest">
                Password
              </label>
              {mode === "signin" && (
                <button
                  type="button"
                  className="text-[8px] sm:text-[9px] md:text-[10px] font-bold text-violet-500 uppercase tracking-widest hover:text-violet-600"
                >
                  Forgot?
                </button>
              )}
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-5 sm:px-6 py-3.5 sm:py-4 md:py-4.5 md:px-7 rounded-lg sm:rounded-xl md:rounded-2xl border border-slate-100 bg-[#fafafa] text-slate-700 font-medium text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-300 transition-all placeholder:text-slate-300 shadow-sm tracking-[0.1em] sm:tracking-[0.15em] md:tracking-[0.2em]"
              required
            />
          </div>

          {mode === "signup" && (
            <div className="space-y-3 sm:space-y-4 md:space-y-5">
              <label className="block text-[8px] sm:text-[9px] md:text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest ml-1 sm:ml-1.5">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-5 sm:px-6 py-3.5 sm:py-4 md:py-4.5 md:px-7 rounded-lg sm:rounded-xl md:rounded-2xl border border-slate-100 bg-[#fafafa] text-slate-700 font-medium text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-300 transition-all placeholder:text-slate-300 shadow-sm tracking-[0.1em] sm:tracking-[0.15em] md:tracking-[0.2em]"
                required
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white py-2.5 sm:py-3 md:py-3.5 lg:py-4 rounded-lg sm:rounded-xl md:rounded-2xl font-bold text-[8px] sm:text-[9px] md:text-xs uppercase tracking-[0.15em] sm:tracking-[0.2em] shadow-lg shadow-violet-600/20 transform active:scale-95 transition-all flex justify-center items-center gap-2 mt-1 sm:mt-2 md:mt-3"
          >
            {isLoading ? (
              <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                {mode === "signin" ? "Sign In" : "Sign Up"}
                <svg
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 sm:mt-8 md:mt-10 lg:mt-12 pt-4 sm:pt-6 md:pt-8 border-t border-slate-100 w-full text-center">
          <p className="text-[10px] sm:text-[11px] md:text-xs font-medium text-slate-500">
            {mode === "signin"
              ? "Need a new account?"
              : "Already have an account?"}
            <button
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="ml-3 sm:ml-4 md:ml-5 text-violet-500 font-bold uppercase tracking-widest hover:text-violet-600 transition-colors"
            >
              {mode === "signin" ? "Sign Up" : "Sign In"}
            </button>
          </p>
        </div>
      </div>

      <div className="absolute bottom-2 sm:bottom-4 md:bottom-6 text-[6px] sm:text-[7px] md:text-[8px] font-bold uppercase tracking-[0.3em] sm:tracking-[0.4em] md:tracking-[0.5em] text-slate-300 text-center px-2">
        &copy; Orbital Systems • Enterprise Security Verified
      </div>
    </div>
  );
};

export default Login;
