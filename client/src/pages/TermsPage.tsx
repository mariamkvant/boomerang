import React from 'react';

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto animate-fade-in prose prose-sm pb-24 md:pb-8">
      <h1 className="text-2xl font-bold mb-2">Terms of Service</h1>
      <p className="text-sm text-gray-500 mb-6">Last updated: March 31, 2026</p>

      <p>Welcome to Boomerang. By using our platform at boomerang.fyi, you agree to these terms.</p>

      <h2 className="text-lg font-semibold mt-6 mb-2">1. What Boomerang Is</h2>
      <p className="text-sm text-gray-600">Boomerang is a community marketplace where people offer, discover, and pay for local services and items. Payments are processed in EUR or GEL via Stripe (and BOG Pay for Georgia). Boomerang charges a 20% platform fee on each completed transaction.</p>

      <h2 className="text-lg font-semibold mt-6 mb-2">2. Your Account</h2>
      <ul className="list-disc pl-6 space-y-1 text-sm text-gray-600">
        <li>You must be at least 16 years old to use Boomerang</li>
        <li>You are responsible for keeping your password secure</li>
        <li>One account per person</li>
        <li>You must provide accurate information</li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2">3. Payments & Fees</h2>
      <ul className="list-disc pl-6 space-y-1 text-sm text-gray-600">
        <li>All payments are processed in EUR or GEL via Stripe (or BOG Pay for Georgian users)</li>
        <li>Prices are set by providers in EUR or GEL and are displayed before you request</li>
        <li>Boomerang charges a 20% platform fee on each completed transaction</li>
        <li>Payments are held in escrow until the requester confirms delivery</li>
        <li>Refunds are issued if the provider does not deliver or a dispute is resolved in the requester's favour</li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2">4. Services & Exchanges</h2>
      <ul className="list-disc pl-6 space-y-1 text-sm text-gray-600">
        <li>All exchanges are between users directly. Boomerang is not a party to any exchange.</li>
        <li>You are responsible for the quality and safety of services you provide</li>
        <li>Services must be legal and not harmful</li>
        <li>Both parties must confirm completion before payment is released</li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2">5. Prohibited Conduct</h2>
      <ul className="list-disc pl-6 space-y-1 text-sm text-gray-600">
        <li>No illegal, harmful, or fraudulent services</li>
        <li>No harassment, discrimination, or abusive behavior</li>
        <li>No spam, fake accounts, or manipulation of the platform</li>
        <li>No sharing of others' personal information without consent</li>
        <li>No commercial advertising or solicitation</li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2">6. Content & Reviews</h2>
      <p className="text-sm text-gray-600">You retain ownership of content you post. By posting, you grant Boomerang a license to display it on the platform. Reviews must be honest and based on real exchanges. We may remove content that violates these terms.</p>

      <h2 className="text-lg font-semibold mt-6 mb-2">7. Liability & Disclaimer</h2>
      <p className="text-sm text-gray-600">Boomerang is a marketplace platform that connects users. We are not a party to any exchange or transaction between users. Specifically:</p>
      <ul className="list-disc pl-6 space-y-1 text-sm text-gray-600">
        <li>Users are solely responsible for the quality, safety, legality, and accuracy of services and items they offer or exchange</li>
        <li>Boomerang is not liable for any disputes, damages, losses, injuries, or dissatisfaction arising from exchanges between users</li>
        <li>All exchanges are conducted at your own risk. You acknowledge that Boomerang does not vet, endorse, or guarantee any user or service</li>
        <li>Boomerang provides dispute resolution tools (messaging, dispute flags, admin mediation) as a courtesy but does not guarantee outcomes or resolutions</li>
        <li>The platform is provided "as is" without warranties of any kind, express or implied, including but not limited to merchantability, fitness for a particular purpose, or non-infringement</li>
        <li>To the maximum extent permitted by law, Boomerang's total liability shall not exceed the amount paid by you in the 30 days preceding the claim</li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2">8. Platform Fee</h2>
      <p className="text-sm text-gray-600">Boomerang charges a 20% platform fee on each completed transaction. The requester pays the provider's listed price in full. The provider receives 80% of that amount. The 20% fee covers payment processing, platform maintenance, and trust infrastructure.</p>

      <h2 className="text-lg font-semibold mt-6 mb-2">9. Account Termination</h2>
      <p className="text-sm text-gray-600">You can delete your account at any time from Account Settings. We may suspend or terminate accounts that violate these terms, with or without notice.</p>

      <h2 className="text-lg font-semibold mt-6 mb-2">10. Disputes</h2>
      <p className="text-sm text-gray-600">We encourage users to resolve disputes through the in-app messaging system. Boomerang may mediate disputes but is not obligated to do so. Dispute resolution tools are provided as a convenience and do not create any obligation or guarantee of a particular outcome. For unresolved disputes, Luxembourg law applies.</p>

      <h2 className="text-lg font-semibold mt-6 mb-2">11. Changes</h2>
      <p className="text-sm text-gray-600">We may update these terms. Continued use of Boomerang after changes constitutes acceptance. We will notify users of significant changes.</p>

      <h2 className="text-lg font-semibold mt-6 mb-2">12. Governing Law</h2>
      <p className="text-sm text-gray-600">These terms are governed by the laws of the Grand Duchy of Luxembourg. Any disputes shall be subject to the jurisdiction of Luxembourg courts.</p>

      <h2 className="text-lg font-semibold mt-6 mb-2">13. Contact</h2>
      <p className="text-sm text-gray-600">Questions about these terms: legal@boomerang.fyi</p>
    </div>
  );
}
