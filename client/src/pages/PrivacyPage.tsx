import React from 'react';

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto animate-fade-in prose prose-sm pb-24 md:pb-8">
      <h1 className="text-2xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-6">Last updated: March 31, 2026</p>

      <p>Boomerang ("we", "our", "us") operates the boomerang.fyi platform. This Privacy Policy explains how we collect, use, and protect your personal data in compliance with the General Data Protection Regulation (GDPR) and Luxembourg data protection laws.</p>

      <h2 className="text-lg font-semibold mt-6 mb-2">1. Data We Collect</h2>
      <p>We collect the following personal data when you use Boomerang:</p>
      <ul className="list-disc pl-6 space-y-1 text-sm text-gray-600">
        <li>Account information: username, email address, password (encrypted)</li>
        <li>Profile information: bio, city/location, languages spoken (voluntarily provided)</li>
        <li>Service listings: titles, descriptions, categories, pricing in boomerangs</li>
        <li>Communications: messages between users, service request details</li>
        <li>Usage data: login times, pages visited, features used</li>
        <li>Device data: browser type, operating system (for PWA functionality)</li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2">2. How We Use Your Data</h2>
      <ul className="list-disc pl-6 space-y-1 text-sm text-gray-600">
        <li>To provide and maintain the Boomerang platform</li>
        <li>To match you with relevant services and help requests</li>
        <li>To send notifications about your service requests and messages</li>
        <li>To verify your identity (email verification)</li>
        <li>To calculate trust scores and achievements</li>
        <li>To improve our platform and user experience</li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2">3. Legal Basis (GDPR)</h2>
      <p className="text-sm text-gray-600">We process your data based on: (a) your consent when you create an account, (b) contractual necessity to provide our services, (c) legitimate interest to improve and secure our platform.</p>

      <h2 className="text-lg font-semibold mt-6 mb-2">4. Data Sharing</h2>
      <p className="text-sm text-gray-600">We do not sell your personal data. We share limited data with:</p>
      <ul className="list-disc pl-6 space-y-1 text-sm text-gray-600">
        <li>Other Boomerang users: your public profile, services, and reviews</li>
        <li>Service providers: Resend (email delivery), Railway (hosting)</li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2">5. Your Rights (GDPR)</h2>
      <p className="text-sm text-gray-600">You have the right to:</p>
      <ul className="list-disc pl-6 space-y-1 text-sm text-gray-600">
        <li>Access your personal data</li>
        <li>Correct inaccurate data</li>
        <li>Delete your account and all associated data</li>
        <li>Export your data in a portable format</li>
        <li>Withdraw consent at any time</li>
        <li>Lodge a complaint with the CNPD (Luxembourg data protection authority)</li>
      </ul>
      <p className="text-sm text-gray-600 mt-2">To exercise these rights, go to Account Settings or contact us at privacy@boomerang.fyi.</p>

      <h2 className="text-lg font-semibold mt-6 mb-2">6. Data Retention</h2>
      <p className="text-sm text-gray-600">We retain your data for as long as your account is active. When you delete your account, all personal data is permanently removed within 30 days. Anonymized usage statistics may be retained.</p>

      <h2 className="text-lg font-semibold mt-6 mb-2">7. Data Security</h2>
      <p className="text-sm text-gray-600">We use industry-standard security measures including encrypted passwords (bcrypt), HTTPS encryption, and secure database hosting. No system is 100% secure, and we cannot guarantee absolute security.</p>

      <h2 className="text-lg font-semibold mt-6 mb-2">8. Cookies</h2>
      <p className="text-sm text-gray-600">We use localStorage to store your authentication token and language preference. We do not use tracking cookies or third-party analytics.</p>

      <h2 className="text-lg font-semibold mt-6 mb-2">9. Children</h2>
      <p className="text-sm text-gray-600">Boomerang is not intended for users under 16 years of age. We do not knowingly collect data from children.</p>

      <h2 className="text-lg font-semibold mt-6 mb-2">10. Changes</h2>
      <p className="text-sm text-gray-600">We may update this policy. We will notify users of significant changes via email or in-app notification.</p>

      <h2 className="text-lg font-semibold mt-6 mb-2">11. Contact</h2>
      <p className="text-sm text-gray-600">For privacy questions: privacy@boomerang.fyi</p>
      <p className="text-sm text-gray-600">Data Protection Authority: Commission Nationale pour la Protection des Données (CNPD), Luxembourg</p>
    </div>
  );
}
