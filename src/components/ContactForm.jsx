import { useState } from "react";
import axios from "axios";

const BASE = "http://127.0.0.1:8000/api";

export default function ContactForm() {
  const [form, setForm]       = useState({ firstName: "", lastName: "", email: "", phone: "", message: "", messageType: "inquiry" });
  const [sent, setSent]       = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError]     = useState(null);
  const [attachment, setAttachment] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fieldErrors, setFieldErrors] = useState(null);

  const handleChange = (e) => {
    const name = e.target.name;
    let val = e.target.value;
    if (name === 'phone') {
      val = String(val).replace(/\D/g, '').slice(0, 11);
    }
    if (name === 'attachment') {
      const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
      setAttachment(file);
      setFieldErrors(null);
      setError(null);
      setUploadProgress(0);
      if (file && file.type.startsWith('image/')) {
        try {
          const url = URL.createObjectURL(file);
          setPreviewUrl(url);
        } catch (err) {
          setPreviewUrl(null);
        }
      } else {
        setPreviewUrl(null);
      }
      return;
    }
    setForm((f) => ({ ...f, [name]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setError(null);
    setFieldErrors(null);
    setUploadProgress(0);

    try {
      const allowed = ['application/pdf','image/jpeg','image/png','image/jpg','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','text/plain'];
      if (attachment) {
        if (!allowed.includes(attachment.type)) {
          throw { response: { data: { message: 'Attachment type not allowed.' } } };
        }
        if (attachment.size > 5 * 1024 * 1024) {
          throw { response: { data: { message: 'Attachment exceeds 5MB limit.' } } };
        }
      }

      const allowedTypes = ['inquiry','sales','finance','marketing','report_bugs'];
      if (form.messageType && !allowedTypes.includes(form.messageType)) {
        throw { response: { data: { message: 'Invalid message type.' } } };
      }

      const fd = new FormData();
      fd.append('first_name', form.firstName);
      fd.append('last_name', form.lastName);
      fd.append('email', form.email);
      if (form.phone) fd.append('phone_number', form.phone);
      fd.append('message', form.message);
      if (form.messageType) fd.append('message_type', form.messageType);
      if (attachment) fd.append('attachment', attachment);

      await axios.post(`${BASE}/contacts`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (e.total) setUploadProgress(Math.round((e.loaded * 100) / e.total));
        }
      });

      setSent(true);
      setForm({ firstName: "", lastName: "", email: "", phone: "", message: "", messageType: "inquiry" });
      setAttachment(null);
      setPreviewUrl(null);
      setUploadProgress(0);
    } catch (err) {
      const resp = err.response?.data;
      if (resp) {
        if (resp.errors) {
          setFieldErrors(resp.errors);
          const first = Object.values(resp.errors)[0];
          setError(Array.isArray(first) ? first[0] : String(first));
        } else if (resp.message) {
          setError(resp.message);
        } else {
          setError('Something went wrong. Please try again.');
        }
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setSending(false);
    }
  };

  const valid = form.firstName && form.lastName && form.email && form.message;

  return (
    <div className="bg-white border border-[#e8f0eb] rounded-2xl p-8 mb-6">
      <h2 className="font-serif text-2xl text-[#2d5a3d] mb-6 pb-3 border-b-2 border-[#d1e8da]">Send Us a Message</h2>

      {sent ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <div className="text-5xl">✅</div>
          <h3 className="font-serif text-2xl text-[#1a2e22]">Message Sent!</h3>
          <p className="text-[#4b5563] text-sm">Thank you for reaching out. Our team will get back to you within 1 business day.</p>
          <button
            className="mt-2 px-6 py-2.5 border border-[#4d7b65] rounded-xl text-sm font-semibold text-[#4d7b65] hover:bg-[#4d7b65] hover:text-white transition-all"
            onClick={() => setSent(false)}
          >
            Send Another Message
          </button>
        </div>
      ) : (
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#374151]">First Name *</label>
              <input
                name="firstName" value={form.firstName} onChange={handleChange}
                placeholder="Juan" required
                className="px-3.5 py-2.5 border border-[#c5ddd0] rounded-xl text-sm text-[#1a2e22] bg-[#fafcfb] outline-none focus:border-[#4d7b65] focus:ring-2 focus:ring-[#4d7b65]/10 focus:bg-white transition-all placeholder-[#9ca3af]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#374151]">Last Name *</label>
              <input
                name="lastName" value={form.lastName} onChange={handleChange}
                placeholder="dela Cruz" required
                className="px-3.5 py-2.5 border border-[#c5ddd0] rounded-xl text-sm text-[#1a2e22] bg-[#fafcfb] outline-none focus:border-[#4d7b65] focus:ring-2 focus:ring-[#4d7b65]/10 focus:bg-white transition-all placeholder-[#9ca3af]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#374151]">Email Address *</label>
            <input
              name="email" type="email" value={form.email} onChange={handleChange}
              placeholder="juan@company.com" required
              className="px-3.5 py-2.5 border border-[#c5ddd0] rounded-xl text-sm text-[#1a2e22] bg-[#fafcfb] outline-none focus:border-[#4d7b65] focus:ring-2 focus:ring-[#4d7b65]/10 focus:bg-white transition-all placeholder-[#9ca3af]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#374151]">Phone Number</label>
            <input
              name="phone" type="tel" value={form.phone} onChange={handleChange}
              placeholder="+63 912 345 6789"
              inputMode="numeric"
              maxLength={11}
              className="px-3.5 py-2.5 border border-[#c5ddd0] rounded-xl text-sm text-[#1a2e22] bg-[#fafcfb] outline-none focus:border-[#4d7b65] focus:ring-2 focus:ring-[#4d7b65]/10 focus:bg-white transition-all placeholder-[#9ca3af]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="text-xs font-semibold text-[#374151]">Type of Message</div>
            <div role="radiogroup" aria-label="Message Type" className="flex gap-2 mt-2">
              {[
                { value: 'inquiry', label: 'Inquiry' },
                { value: 'sales', label: 'Sales' },
                { value: 'finance', label: 'Finance' },
                { value: 'marketing', label: 'Marketing' },
                { value: 'report_bugs', label: 'Report Bugs' },
              ].map((opt) => (
                <label key={opt.value} className={`inline-flex items-center gap-2 px-3 py-2 border rounded-xl cursor-pointer select-none text-sm ${form.messageType === opt.value ? 'bg-[#4d7b65] text-white border-[#4d7b65]' : 'bg-[#fafcfb] border-[#e8f0eb] text-[#1a2e22]'}`}>
                  <input
                    type="radio"
                    name="messageType"
                    value={opt.value}
                    checked={form.messageType === opt.value}
                    onChange={handleChange}
                    className="sr-only"
                    aria-checked={form.messageType === opt.value}
                  />
                  <span className="text-sm font-medium">{opt.label}</span>
                </label>
              ))}
            </div>
            {fieldErrors?.message_type && (
              <div className="text-sm text-red-600 mt-1">{fieldErrors.message_type[0]}</div>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#374151]">Message *</label>
            <textarea
              name="message" value={form.message} onChange={handleChange}
              placeholder="Tell us how we can help you…"
              rows={5} required
              className="w-full px-3.5 py-3 border border-[#c5ddd0] rounded-xl text-sm text-[#1a2e22] bg-[#fafcfb] resize-y outline-none focus:border-[#4d7b65] focus:ring-2 focus:ring-[#4d7b65]/10 focus:bg-white transition-all placeholder-[#9ca3af] box-border"
            />
            {fieldErrors?.message && (
              <div className="text-sm text-red-600 mt-1">{fieldErrors.message[0]}</div>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#374151]">Attachment</label>
            <input
              name="attachment"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.txt"
              onChange={handleChange}
              className="px-3.5 py-2.5 border border-[#c5ddd0] rounded-xl text-sm text-[#1a2e22] bg-[#fafcfb] outline-none focus:border-[#4d7b65] focus:ring-2 focus:ring-[#4d7b65]/10 focus:bg-white transition-all"
            />

            {previewUrl ? (
              <div className="mt-3 flex items-center gap-3">
                <img src={previewUrl} alt="preview" className="w-20 h-20 object-cover rounded-md border" />
                <div className="text-sm text-[#374151]">
                  <div className="font-semibold">{attachment?.name}</div>
                  <div className="text-xs text-[#6b7c70]">{(attachment?.size/1024/1024).toFixed(2)} MB</div>
                  <button type="button" onClick={() => { setAttachment(null); setPreviewUrl(null); }} className="mt-2 text-sm text-red-600">Remove</button>
                </div>
              </div>
            ) : (
              attachment && (
                <div className="mt-3 text-sm text-[#374151]">
                  <div className="font-semibold">{attachment.name}</div>
                  <div className="text-xs text-[#6b7c70]">{(attachment.size/1024/1024).toFixed(2)} MB</div>
                  <button type="button" onClick={() => setAttachment(null)} className="mt-2 text-sm text-red-600">Remove</button>
                </div>
              )
            )}

            {uploadProgress > 0 && (
              <div className="w-full bg-[#f0f4f1] rounded-full h-2 mt-3">
                <div className="h-2 rounded-full bg-[#4d7b65]" style={{ width: `${uploadProgress}%` }} />
              </div>
            )}
          </div>

          {error && (
            <div className="px-4 py-3 text-sm text-red-600 border border-red-200 bg-red-50 rounded-xl">
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={sending || !valid}
            className={`self-start inline-flex items-center gap-2 px-8 py-3.5 bg-[#2d5a3d] text-white border-2 border-[#2d5a3d] rounded-xl text-sm font-bold tracking-wide transition-all
              ${!valid ? "opacity-50 cursor-default" : ""}
              ${sending ? "opacity-75 cursor-wait" : ""}
              ${valid && !sending ? "hover:bg-[#3d6552] hover:border-[#3d6552] hover:-translate-y-px hover:shadow-lg hover:shadow-[#4d7b65]/30" : ""}
            `}
          >
            {sending ? "Sending…" : "📨 Send Message"}
          </button>
        </form>
      )}
    </div>
  );
}
