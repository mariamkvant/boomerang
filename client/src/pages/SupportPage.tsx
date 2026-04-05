import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

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
    <div className="max-w-3xl mx-auto animate-fade-in">
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
    </div>
  );
}
