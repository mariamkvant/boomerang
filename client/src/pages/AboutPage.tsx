import React from 'react';
import { Link } from 'react-router-dom';

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto animate-fade-in pb-24 md:pb-8">

      {/* Hero */}
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-3">About Boomerang</h1>
        <p className="text-base text-gray-500 dark:text-gray-400 leading-relaxed">
          Boomerang is a neighbourhood services marketplace that connects people who need help with people who can provide it — tutoring, home repair, gardening, childcare, tech support, and more. We make it easy to find trusted local providers, pay securely, and get things done.
        </p>
      </div>

      {/* Mission */}
      <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800 rounded-2xl p-6 mb-8">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Our mission</h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          We believe communities are stronger when neighbours help each other. Boomerang exists to make that exchange easy, safe, and fair — giving everyone a way to earn from their skills and get reliable help when they need it.
        </p>
      </div>

      {/* How it works */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">How it works</h2>
        <div className="space-y-4">
          {[
            { n: '1', title: 'List your skills', desc: 'Create a service listing with your price. Gardening, tutoring, tech help, home repair — anything legal and local.' },
            { n: '2', title: 'Get booked', desc: 'Neighbours browse and request your services. You accept or decline — you stay in control of your schedule.' },
            { n: '3', title: 'Deliver and earn', desc: 'Complete the service. The requester confirms delivery and 80% of the payment goes straight to your bank account.' },
          ].map(s => (
            <div key={s.n} className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-[#1f2937] text-white flex items-center justify-center text-sm font-bold shrink-0">{s.n}</div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">{s.title}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payments */}
      <div className="bg-gray-50 dark:bg-[#1c1c1c] border border-gray-100 dark:border-gray-800 rounded-2xl p-6 mb-8">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Payments & pricing</h2>
        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
          <li>✓ Providers set their own prices in EUR or GEL</li>
          <li>✓ Payments are held securely in escrow until the service is confirmed</li>
          <li>✓ Providers receive 80% — Boomerang charges a 20% platform fee</li>
          <li>✓ Payouts are processed via Stripe (EUR) or BOG Pay (GEL)</li>
          <li>✓ Free services are supported — set the price to €0</li>
        </ul>
      </div>

      {/* Contact */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Contact us</h2>
        <div className="bg-white dark:bg-[#202c33] border border-gray-100 dark:border-gray-700 rounded-2xl p-6 space-y-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
            </svg>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Address</p>
              <p className="text-sm text-gray-700 dark:text-gray-200">13 Avenue Pasteur<br />Limpertsberg 2311<br />Luxembourg</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 6Z" />
            </svg>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Phone</p>
              <a href="tel:+352621301338" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">+352 621 301 338</a>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
            </svg>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Email</p>
              <a href="mailto:support@boomerang.fyi" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">support@boomerang.fyi</a>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
            </svg>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Website</p>
              <a href="https://boomerang.fyi" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">boomerang.fyi</a>
            </div>
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="flex flex-wrap gap-3 text-sm">
        <Link to="/terms" className="text-primary-600 dark:text-primary-400 hover:underline">Terms of Service</Link>
        <span className="text-gray-300">·</span>
        <Link to="/privacy" className="text-primary-600 dark:text-primary-400 hover:underline">Privacy Policy</Link>
        <span className="text-gray-300">·</span>
        <Link to="/support" className="text-primary-600 dark:text-primary-400 hover:underline">Help & Support</Link>
      </div>

    </div>
  );
}
