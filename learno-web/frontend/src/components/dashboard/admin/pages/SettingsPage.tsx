'use client';

import { useState } from "react";
import { School, Bell, Shield, Users, Palette, Globe, Save, ChevronRight, Check } from "lucide-react";

const sections = [
  { id: "school", icon: School, label: "School Info" },
  { id: "notifications", icon: Bell, label: "Notifications" },
  { id: "users", icon: Users, label: "User Access" },
  { id: "appearance", icon: Palette, label: "Appearance" },
  { id: "security", icon: Shield, label: "Security" },
  { id: "integrations", icon: Globe, label: "Integrations" },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className="flex-shrink-0 cursor-pointer transition-all duration-200"
      style={{
        width: "40px",
        height: "22px",
        borderRadius: "11px",
        background: checked ? "#6366F1" : "#E2E8F0",
        position: "relative",
        border: "none",
        outline: "none",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: "3px",
          left: checked ? "21px" : "3px",
          width: "16px",
          height: "16px",
          borderRadius: "50%",
          background: "#fff",
          transition: "left 0.2s",
          boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
        }}
      />
    </button>
  );
}

export function SettingsPage() {
  const [activeSection, setActiveSection] = useState("school");
  const [saved, setSaved] = useState(false);
  const [schoolName, setSchoolName] = useState("Learno Academy");
  const [city, setCity] = useState("Tunis");
  const [country, setCountry] = useState("Tunisia");
  const [language, setLanguage] = useState("English");

  const [notifications, setNotifications] = useState({
    urgentAlerts: true,
    weeklyReport: true,
    teacherActivity: false,
    environmentAlerts: true,
    studentFlags: true,
    systemUpdates: false,
  });

  const toggleNotif = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const notifItems = [
    { key: "urgentAlerts", label: "Urgent Alerts", desc: "Real-time critical classroom alerts" },
    { key: "weeklyReport", label: "Weekly Report", desc: "Automated summary every Monday" },
    { key: "teacherActivity", label: "Teacher Activity", desc: "When teachers log in or out" },
    { key: "environmentAlerts", label: "Environment Alerts", desc: "CO₂, noise, and lighting events" },
    { key: "studentFlags", label: "Student Flags", desc: "When a student is flagged for attention" },
    { key: "systemUpdates", label: "System Updates", desc: "Platform releases and changes" },
  ] as const;

  return (
    <div className="flex gap-5">
      {/* Sidebar nav */}
      <div className="w-52 flex-shrink-0">
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid #ECEEF4" }}>
          {sections.map(({ id, icon: Icon, label }) => {
            const isActive = activeSection === id;
            return (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className="w-full flex items-center gap-3 px-4 py-3 transition-colors cursor-pointer"
                style={{
                  borderBottom: "1px solid #F4F5F8",
                  background: isActive ? "#EEF0FD" : "transparent",
                  textAlign: "left",
                }}
              >
                <Icon
                  style={{ width: "16px", height: "16px", color: isActive ? "#6366F1" : "#94A3B8", flexShrink: 0 }}
                />
                <span style={{ fontSize: "13px", fontWeight: isActive ? 600 : 500, color: isActive ? "#6366F1" : "#64748B" }}>
                  {label}
                </span>
                {isActive && <ChevronRight style={{ width: "13px", height: "13px", color: "#A5B4FC", marginLeft: "auto" }} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {activeSection === "school" && (
          <div className="bg-white rounded-2xl p-6" style={{ border: "1px solid #ECEEF4" }}>
            <h3 className="text-slate-700 mb-5" style={{ fontWeight: 600, fontSize: "0.95rem" }}>School Information</h3>
            <div className="space-y-4 max-w-lg">
              {[
                { label: "School Name", value: schoolName, setter: setSchoolName },
                { label: "City", value: city, setter: setCity },
                { label: "Country", value: country, setter: setCountry },
              ].map((field) => (
                <div key={field.label}>
                  <label className="text-slate-600 block mb-1.5" style={{ fontSize: "13px", fontWeight: 500 }}>
                    {field.label}
                  </label>
                  <input
                    type="text"
                    value={field.value}
                    onChange={(e) => field.setter(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl focus:outline-none transition-all"
                    style={{ background: "#F8F9FB", border: "1px solid #ECEEF4", fontSize: "13.5px", color: "#1E293B" }}
                  />
                </div>
              ))}
              <div>
                <label className="text-slate-600 block mb-1.5" style={{ fontSize: "13px", fontWeight: 500 }}>Platform Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl focus:outline-none cursor-pointer"
                  style={{ background: "#F8F9FB", border: "1px solid #ECEEF4", fontSize: "13.5px", color: "#1E293B" }}
                >
                  <option>English</option>
                  <option>French</option>
                  <option>Arabic</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all cursor-pointer"
                  style={{
                    background: saved ? "#F0FDF4" : "#6366F1",
                    color: saved ? "#16A34A" : "#fff",
                    fontSize: "13.5px",
                    fontWeight: 600,
                  }}
                >
                  {saved ? <Check style={{ width: "15px", height: "15px" }} /> : <Save style={{ width: "15px", height: "15px" }} />}
                  {saved ? "Saved!" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeSection === "notifications" && (
          <div className="bg-white rounded-2xl p-6" style={{ border: "1px solid #ECEEF4" }}>
            <h3 className="text-slate-700 mb-1" style={{ fontWeight: 600, fontSize: "0.95rem" }}>Notification Preferences</h3>
            <p className="text-slate-400 mb-5" style={{ fontSize: "13px" }}>Choose which events trigger email or in-app notifications.</p>
            <div className="space-y-1">
              {notifItems.map(({ key, label, desc }) => (
                <div
                  key={key}
                  className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 transition-colors"
                  style={{ border: "1px solid #F4F5F8" }}
                >
                  <div>
                    <p className="text-slate-700" style={{ fontSize: "13.5px", fontWeight: 600 }}>{label}</p>
                    <p className="text-slate-400 mt-0.5" style={{ fontSize: "12px" }}>{desc}</p>
                  </div>
                  <Toggle checked={notifications[key]} onChange={() => toggleNotif(key)} />
                </div>
              ))}
            </div>
            <div className="mt-5">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all cursor-pointer"
                style={{
                  background: saved ? "#F0FDF4" : "#6366F1",
                  color: saved ? "#16A34A" : "#fff",
                  fontSize: "13.5px",
                  fontWeight: 600,
                }}
              >
                {saved ? <Check style={{ width: "15px", height: "15px" }} /> : <Save style={{ width: "15px", height: "15px" }} />}
                {saved ? "Saved!" : "Save Preferences"}
              </button>
            </div>
          </div>
        )}

        {activeSection === "users" && (
          <div className="bg-white rounded-2xl p-6" style={{ border: "1px solid #ECEEF4" }}>
            <h3 className="text-slate-700 mb-5" style={{ fontWeight: 600, fontSize: "0.95rem" }}>User Access & Roles</h3>
            <div className="space-y-3">
              {[
                { name: "Sarah Admin", role: "School Admin", email: "s.admin@learno.edu", access: "Full Access", avatar: "SA", bg: "#EEF0FD", color: "#6366F1" },
                { name: "Dr. Karim Bouhriz", role: "Psychologist", email: "k.bouhriz@learno.edu", access: "Student Data", avatar: "KB", bg: "#F5F3FF", color: "#8B5CF6" },
                { name: "Ms. Amira Sefi", role: "Inclusion Specialist", email: "a.sefi@learno.edu", access: "Support Panel", avatar: "AS", bg: "#F0FDF9", color: "#14B8A6" },
                { name: "Mr. Zied Nasri", role: "IT Support", email: "z.nasri@learno.edu", access: "System Config", avatar: "ZN", bg: "#FFFBEB", color: "#F59E0B" },
              ].map((u) => (
                <div
                  key={u.name}
                  className="flex items-center justify-between p-4 rounded-xl"
                  style={{ border: "1px solid #ECEEF4" }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: u.bg }}>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: u.color }}>{u.avatar}</span>
                    </div>
                    <div>
                      <p className="text-slate-700" style={{ fontSize: "13.5px", fontWeight: 600 }}>{u.name}</p>
                      <p className="text-slate-400" style={{ fontSize: "12px" }}>{u.email} · {u.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full px-2.5 py-1" style={{ fontSize: "12px", fontWeight: 600, background: "#EEF0FD", color: "#6366F1" }}>
                      {u.access}
                    </span>
                    <button className="text-slate-400 hover:text-slate-600 cursor-pointer px-2 py-1 rounded-lg hover:bg-slate-50 transition-colors" style={{ fontSize: "12.5px" }}>
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button
              className="mt-4 flex items-center gap-1.5 text-white px-4 py-2 rounded-xl transition-colors cursor-pointer"
              style={{ fontSize: "13px", fontWeight: 600, background: "#81D4FA" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#4FC3F7"}
              onMouseLeave={(e) => e.currentTarget.style.background = "#81D4FA"}
            >
              + Invite User
            </button>
          </div>
        )}

        {(activeSection === "appearance" || activeSection === "security" || activeSection === "integrations") && (
          <div className="bg-white rounded-2xl p-8 text-center" style={{ border: "1px solid #ECEEF4" }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "#EEF0FD" }}>
              {activeSection === "appearance" && <Palette style={{ width: "22px", height: "22px", color: "#6366F1" }} />}
              {activeSection === "security" && <Shield style={{ width: "22px", height: "22px", color: "#6366F1" }} />}
              {activeSection === "integrations" && <Globe style={{ width: "22px", height: "22px", color: "#6366F1" }} />}
            </div>
            <h3 className="text-slate-700 mb-2" style={{ fontWeight: 600, fontSize: "1rem" }}>
              {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)} Settings
            </h3>
            <p className="text-slate-400 max-w-xs mx-auto" style={{ fontSize: "13.5px", lineHeight: 1.6 }}>
              This section is being configured for your school. Full controls will be available in the next release.
            </p>
            <div
              className="mt-5 inline-block px-5 py-2.5 rounded-xl cursor-pointer"
              style={{ background: "#EEF0FD", color: "#6366F1", fontSize: "13px", fontWeight: 600 }}
            >
              Coming Soon
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
