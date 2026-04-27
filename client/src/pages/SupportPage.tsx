import React, { useState } from 'react';

import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { api } from '../api';

const FAQS = [
  {
    q: 'What is Boomerang?',
    a: 'Boomerang is a community platform where people exchange skills and services using a points system called "boomerangs." No real money is involved — you earn boomerangs by helping others and spend them to get help.',
  },
  {
    q: 'How do boomerangs work?',
    a: 'You start with 50 free boomerangs. When you provide a service, you earn boomerangs from the requester. When you request a service, you pay boomerangs to the provider. Points transfer only after both parties confirm the exchange is complete.',
  },
  {
    q: 'Is Boomerang free?',
    a: 'Yes, completely free. No credit card, no subscription, no hidden fees. Boomerangs have no monetary value.',
  },
  {
    q: 'How do I offer a service?',
    a: 'Go to "Offer Service" from the navigation, choose a category, add a title and description, set the duration and boomerang cost, and publish. Your service will appear in Browse for others to find.',
  },
  {
    q: 'How do I request a service?',
    a: 'Browse available services, click on one you like, pick a date and time if available, add an optional message, and click "Request." The provider will be notified and can accept or decline.',
  },
  {
    q: 'What happens after a service is completed?',
    a: 'The provider marks the service as "Delivered." Then you (the requester) confirm it was completed. Once confirmed, boomerangs transfer automatically. You can then leave a review.',
  },
  {
    q: 'What if there\'s a problem with a service?',
    a: 'If the service wasn\'t delivered as expected, you can open a dispute instead of confirming. Use the messaging system to resolve it with the provider. If needed, contact our support team.',
  },
  {
    q: 'How does the trust score work?',
    a: 'Your trust score (0-100) is based on: email verification, account age, completed exchanges, average rating, and number of reviews. Higher scores unlock Bronze, Silver, Gold, and Platinum levels.',
  },
  {
    q: 'Can I join or create a community?',
    a: 'Yes! Go to Communities to browse public groups or create your own. You can invite people by username or share an invite link. Community members can offer services exclusively within the group.',
  },
  {
    q: 'How do I report someone?',
    a: 'Visit their profile and click "Report." Select a reason and add details. Our team reviews all reports. Users with 5+ pending reports are automatically suspended.',
  },
  {
    q: 'Can I delete my account?',
    a: 'Yes. Go to Account Settings and scroll to "Delete Account." This permanently removes all your data. You can also deactivate (hide) your account temporarily.',
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between py-4 text-left group">
        <span className="text-sm font-medium text-gray-900 group-hover:text-primary-600 pr-4">{q}</span>
        <svg className={`w-5 h-5 text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <p className="text-sm text-gray-600 pb-4 leading-relaxed">{a}</p>}
    </div>
  );
}

export default function SupportPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState<'faq' | 'contact'>('faq');
  const [form, setForm] = useState({ subject: '', message: '', email: user?.email || '' });
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject || !form.message) return;
    try {
      await api.submitSupportTicket({ email: form.email || user?.email, subject: form.subject, message: form.message, user_id: user?.id });
      toast('Message sent! We\'ll get back to you within 24 hours.');
      setSent(true);
      setForm({ subject: '', message: '', email: user?.email || '' });
    } catch (err: any) { toast(err.message, 'error'); }
  };

  return (
    <div className="max-w-3xl mx-auto animate-fade-in pb-24 md:pb-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Help & Support</h1>
        <p className="text-gray-500 text-sm">Find answers or get in touch with our team</p>
      </div>

      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl">
        <button onClick={() => setTab('faq')}
          className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium ${tab === 'faq' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
          FAQ
        </button>
        <button onClick={() => setTab('contact')}
          className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium ${tab === 'contact' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
          Contact Support
        </button>
      </div>

      {tab === 'faq' && (
        <div className="bg-white rounded-2xl shadow-card p-6">
          {FAQS.map((faq, i) => <FAQItem key={i} q={faq.q} a={faq.a} />)}
          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500 mb-2">Can't find what you're looking for?</p>
            <button onClick={() => setTab('contact')} className="text-sm text-primary-600 font-medium hover:underline">Contact our support team →</button>
          </div>
        </div>
      )}

      {tab === 'contact' && (
        <div className="bg-white rounded-2xl shadow-card p-6">
          {sent ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Message sent</h3>
              <p className="text-sm text-gray-500 mb-4">We'll get back to you within 24 hours at {user?.email || form.email}.</p>
              <button onClick={() => setSent(false)} className="text-sm text-primary-600 hover:underline">Send another message</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm text-gray-500 mb-4">Describe your issue and we'll respond within 24 hours.</p>
              {!user && (
                <div>
                  <label htmlFor="support-email" className="block text-sm font-medium text-gray-700 mb-1.5">Your email</label>
                  <input id="support-email" type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none" placeholder="you@example.com" />
                </div>
              )}
              <div>
                <label htmlFor="support-subject" className="block text-sm font-medium text-gray-700 mb-1.5">Subject</label>
                <select id="support-subject" required value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:ring-2 focus:ring-primary-500 outline-none">
                  <option value="">Select a topic</option>
                  <option value="account">Account issue</option>
                  <option value="service">Service or exchange problem</option>
                  <option value="dispute">Dispute resolution</option>
                  <option value="payment">Boomerangs / points issue</option>
                  <option value="bug">Bug report</option>
                  <option value="feature">Feature request</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label htmlFor="support-message" className="block text-sm font-medium text-gray-700 mb-1.5">Message</label>
                <textarea id="support-message" required value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  rows={5} placeholder="Describe your issue in detail..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:ring-2 focus:ring-primary-500 outline-none" />
              </div>
              <button type="submit" className="bg-primary-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-600 text-sm">Send Message</button>
            </form>
          )}
        </div>
      )}

      <div className="mt-8 text-center text-sm text-gray-400">
        <p>You can also reach us at <a href="mailto:support@boomerang.fyi" className="text-primary-600 hover:underline">support@boomerang.fyi</a></p>
      </div>

      {/* Partnership */}
      <div className="bg-white dark:bg-[#202c33] p-6 rounded-2xl shadow-sm mt-8">
        <h3 className="text-lg font-semibold dark:text-white mb-2">Partner with Boomerang</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Are you a local business, NGO, municipality, or community organization? We'd love to explore how Boomerang can support your community.</p>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21m-3.75 3H21" /></svg>
            <div>
              <p className="text-sm font-medium dark:text-white">Local businesses</p>
              <p className="text-xs text-gray-400">Offer your services to the community and gain visibility</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-green-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" /></svg>
            <div>
              <p className="text-sm font-medium dark:text-white">NGOs & nonprofits</p>
              <p className="text-xs text-gray-400">Integrate skill exchange into your community programs</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" /></svg>
            <div>
              <p className="text-sm font-medium dark:text-white">Universities & schools</p>
              <p className="text-xs text-gray-400">Create campus communities for student skill exchange</p>
            </div>
          </div>
        </div>
        <a href="mailto:partnerships@boomerang.fyi?subject=Partnership%20Inquiry"
          className="inline-block mt-4 bg-gray-900 dark:bg-white dark:text-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors">
          Get in touch
        </a>
      </div>

      {/* Support the mission */}
      <div className="bg-gradient-to-r from-primary-50 to-orange-50 dark:from-primary-900/20 dark:to-orange-900/20 border border-primary-100 dark:border-primary-800 p-6 rounded-2xl mt-6 mb-8">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-500 shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>
          </div>
          <div>
            <h3 className="font-semibold dark:text-white">Support the mission</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Boomerang is free for everyone. Help us grow by sharing the app with friends and leaving a review on the App Store.</p>
            <p className="text-[11px] text-gray-400 mt-2">Every share and review helps us reach more communities.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
