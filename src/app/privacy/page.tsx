import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl md:text-4xl font-bold mb-4">Privacy Policy</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-lg max-w-none dark:prose-invert">
          <p><em>Last Updated: {new Date().toLocaleDateString()}</em></p>

          <h2>1. Introduction</h2>
          <p>
            Welcome to PICK PACK SERVICES. We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about this privacy notice, or our practices with regards to your personal information, please contact us.
          </p>

          <h2>2. Information We Collect</h2>
          <p>
            We collect personal information that you voluntarily provide to us when you register on the website, express an interest in obtaining information about us or our products and services, when you participate in activities on the website or otherwise when you contact us.
          </p>
          <p>
            The personal information that we collect depends on the context of your interactions with us and the website, the choices you make and the products and features you use. The personal information we collect may include the following: Name, Phone Number, Email Address, Mailing Address, Job Titles, Contact Preferences, Billing Address, Debit/Credit Card Numbers, Contact or Authentication Data, Shipment details (origin, destination, contents), Tracking information.
          </p>

          <h2>3. How We Use Your Information</h2>
          <p>
            We use personal information collected via our website for a variety of business purposes described below. We process your personal information for these purposes in reliance on our legitimate business interests, in order to enter into or perform a contract with you, with your consent, and/or for compliance with our legal obligations. We indicate the specific processing grounds we rely on next to each purpose listed below.
          </p>
          <ul>
            <li>To facilitate account creation and logon process.</li>
            <li>To post testimonials.</li>
            <li>Request feedback.</li>
            <li>To enable user-to-user communications.</li>
            <li>To manage user accounts.</li>
            <li>To send administrative information to you.</li>
            <li>To protect our Services.</li>
            <li>To enforce our terms, conditions and policies for business purposes, to comply with legal and regulatory requirements or in connection with our contract.</li>
             <li>To respond to legal requests and prevent harm.</li>
             <li>Fulfill and manage your orders/bookings.</li>
             <li>To deliver and facilitate delivery of services to the user.</li>
             <li>To respond to user inquiries/offer support to users.</li>
             <li>To send you marketing and promotional communications.</li>
             <li>Deliver targeted advertising to you.</li>
          </ul>

           <h2>4. Will Your Information Be Shared With Anyone?</h2>
           <p>We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations.</p>

           <h2>5. How Long Do We Keep Your Information?</h2>
           <p>We keep your information for as long as necessary to fulfill the purposes outlined in this privacy notice unless otherwise required by law.</p>

           <h2>6. How Do We Keep Your Information Safe?</h2>
           <p>We aim to protect your personal information through a system of organizational and technical security measures.</p>

           <h2>7. What Are Your Privacy Rights?</h2>
            <p>In some regions, such as the European Economic Area (EEA) and United Kingdom (UK), you have rights that allow you greater access to and control over your personal information. You may review, change, or terminate your account at any time.</p>

          <h2>8. Updates To This Notice</h2>
           <p>We may update this privacy notice from time to time. The updated version will be indicated by an updated "Revised" date and the updated version will be effective as soon as it is accessible.</p>

           <h2>9. How Can You Contact Us About This Notice?</h2>
            <p>If you have questions or comments about this notice, you may email us at support@pickpackservices.com or by post to:</p>
           <p>PICK PACK SERVICES</p>
           <p>[Your Company Address]</p>

        </CardContent>
      </Card>
    </div>
  );
}
