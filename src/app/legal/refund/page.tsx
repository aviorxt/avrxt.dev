import { PolicyCallout, PolicyList, PolicySection, PolicyShell } from '@/components/legal/PolicyShell';
import { buildPageMetadata } from '@/lib/page-metadata';

export const metadata = buildPageMetadata({
  title: 'Refund Policy',
  description: 'How cancellations, duplicate payments, digital deliverables, project deposits, and approved refunds for direct AVRXT services are handled.',
  keywords: ['refund policy', 'cancellation', 'project deposit', 'digital services', 'duplicate payment', 'AVRXT services'],
  path: '/legal/refund',
});

const nav = [
  { id: 'scope', label: 'Scope' }, { id: 'before-work', label: 'Before work starts' }, { id: 'after-work', label: 'After work starts' }, { id: 'eligible', label: 'Eligible cases' }, { id: 'request', label: 'Request process' }, { id: 'timing', label: 'Timing and rights' },
];

export default function RefundPage() {
  return <PolicyShell eyebrow="Commercial policy" title="Refund policy" description="A practical guide to cancellations and refunds for paid work arranged directly with AVRXT. The public website and browser tools are free and do not create a payment obligation." version="v3.0" lastUpdated="8 October 2026" nav={nav} highlights={[{ label: 'Website features', value: 'Free to use' }, { label: 'Approved refunds', value: 'Original payment method' }, { label: 'Project work', value: 'Written scope controls' }]}>
    <PolicySection id="scope" number="01" title="What this policy covers">
      <p>This policy applies only when you make a payment directly to AVRXT for a project, consultation, digital deliverable, or another expressly agreed service. It does not apply to free website tools, the Muzix dashboard, newsletter subscriptions, Ask AI handoffs, third-party purchases, or payments made to another provider.</p>
      <p>A proposal, statement of work, invoice, or signed agreement may contain project-specific cancellation or refund terms. If those terms conflict with this page, the written project terms control for that engagement.</p>
      <PolicyCallout title="No public-feature charge">Using IP, DNS, mail, font, Spotify preview, quote, TCP port, keyboard, Muzix, newsletter, or Ask AI features does not itself purchase a service. The website currently presents no paid checkout for those features.</PolicyCallout>
    </PolicySection>

    <PolicySection id="before-work" number="02" title="Cancellation before work starts">
      <p>If you cancel before work begins and before AVRXT commits non-recoverable third-party costs, the amount paid is generally eligible for refund. Any payment-gateway fee or external cost that cannot be recovered may be deducted only where permitted by law and disclosed with the refund calculation.</p>
      <p>“Work begins” may include discovery, technical auditing, reserved consulting time, architecture, research, design exploration, environment setup, procurement of an agreed third-party service, or development—not only delivery of final files.</p>
    </PolicySection>

    <PolicySection id="after-work" number="03" title="Deposits, milestones, and delivered work">
      <PolicyList items={[
        <><strong>Deposits:</strong> once work begins, the portion covering completed work, reserved time, and committed costs is normally non-refundable.</>,
        <><strong>Milestones:</strong> an accepted or delivered milestone is normally non-refundable unless the written project agreement says otherwise.</>,
        <><strong>Digital deliverables:</strong> source code, designs, reports, credentials, or other digital files cannot be returned after delivery; verified defects will be handled under the agreed revision or warranty terms.</>,
        <><strong>Client delay:</strong> inactivity, missing content, unavailable access, or a change of mind does not automatically make completed work refundable.</>,
      ]} />
      <p>If a project is cancelled after work begins, AVRXT may provide a written breakdown of completed work, reserved time, and committed costs, then determine whether any unused balance remains refundable.</p>
    </PolicySection>

    <PolicySection id="eligible" number="04" title="When a refund may be approved">
      <PolicyList items={[
        'A duplicate or clearly incorrect payment.',
        'A payment received after both parties confirmed cancellation and before work started.',
        'Failure by AVRXT to provide the paid service after a reasonable opportunity to correct the issue.',
        'An unused project balance that the applicable proposal or statement of work expressly makes refundable.',
        'A refund required by mandatory consumer law that applies to the transaction.',
      ]} />
      <p>Refunds are not normally issued for subjective preference changes, incompatibility not disclosed before work, third-party outages, misuse of a deliverable, requirements added after the agreed scope, or interruption of a free website feature.</p>
    </PolicySection>

    <PolicySection id="request" number="05" title="How to request a refund">
      <p>Email <a href="mailto:support@avrxt.dev">support@avrxt.dev</a> with your name, invoice or transaction reference, project reference, payment date, amount, and a short explanation. Do not send full card numbers, passwords, one-time codes, or bank credentials.</p>
      <p>AVRXT may request reasonable evidence needed to locate the payment or assess whether the delivered work matched the written scope. Submit a request promptly after discovering the issue; project-specific deadlines may appear in your agreement.</p>
    </PolicySection>

    <PolicySection id="timing" number="06" title="Review, payment timing, and legal rights">
      <p>Requests are reviewed individually. If approved, a refund is initiated to the original payment method unless another lawful method is agreed. AVRXT will communicate the decision or request additional information within a reasonable period, but banks and payment providers control the final posting time, currency conversion, and any provider-side reversal delay.</p>
      <p>Contact AVRXT before starting a payment dispute so there is an opportunity to investigate duplicate billing or delivery concerns. This request does not waive any chargeback or consumer rights you have under applicable law.</p>
      <PolicyCallout title="Mandatory rights preserved">Nothing in this policy removes a refund, cancellation, warranty, or remedy that cannot legally be excluded.</PolicyCallout>
    </PolicySection>
  </PolicyShell>;
}
