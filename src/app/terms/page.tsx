import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TermsOfServicePage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl md:text-4xl font-bold mb-4">Terms of Service</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-lg max-w-none dark:prose-invert">
          <p><em>Last Updated: {new Date().toLocaleDateString()}</em></p>

          <h2>1. Agreement to Terms</h2>
          <p>
            By using our Services, you agree to be bound by these Terms. If you do not agree to be bound by these Terms, do not use the Services.
          </p>

          <h2>2. Privacy Policy</h2>
          <p>
            Please review our Privacy Policy, which also governs your use of the Services, for information on how we collect, use and share your information.
          </p>

          <h2>3. Changes to these Terms or the Services</h2>
          <p>
            We may update the Terms from time to time in our sole discretion. If we do, we’ll let you know by posting the updated Terms on the Site and/or may also send other communications. It’s important that you review the Terms whenever we update them or you use the Services.
          </p>

          <h2>4. Who May Use the Services?</h2>
          <p>
            You may use the Services only if you are 18 years or older and capable of forming a binding contract with PICK PACK SERVICES, and not otherwise barred from using the Services under applicable law.
          </p>

          <h2>5. Account Security</h2>
           <p>If you choose, or are provided with, a user name, password or any other piece of information as part of our security procedures, you must treat such information as confidential, and you must not disclose it to any other person or entity. You also acknowledge that your account is personal to you and agree not to provide any other person with access to this Website or portions of it using your user name, password or other security information. You agree to notify us immediately of any unauthorized access to or use of your user name or password or any other breach of security.</p>

           <h2>6. Prohibited Uses</h2>
           <p>You may use the Website only for lawful purposes and in accordance with these Terms of Use. You agree not to use the Website:</p>
           <ul>
             <li>In any way that violates any applicable federal, state, local or international law or regulation.</li>
             <li>For the purpose of exploiting, harming or attempting to exploit or harm minors in any way by exposing them to inappropriate content, asking for personally identifiable information or otherwise.</li>
             <li>To transmit, or procure the sending of, any advertising or promotional material, including any "junk mail", "chain letter" or "spam" or any other similar solicitation.</li>
             <li>To impersonate or attempt to impersonate the Company, a Company employee, another user or any other person or entity.</li>
             <li>To engage in any other conduct that restricts or inhibits anyone's use or enjoyment of the Website, or which, as determined by us, may harm the Company or users of the Website or expose them to liability.</li>
           </ul>

          <h2>7. Intellectual Property Rights</h2>
          <p>
            The Website and its entire contents, features and functionality (including but not limited to all information, software, text, displays, images, video and audio, and the design, selection and arrangement thereof), are owned by PICK PACK SERVICES, its licensors or other providers of such material and are protected by United States and international copyright, trademark, patent, trade secret and other intellectual property or proprietary rights laws.
          </p>

          <h2>8. Disclaimers</h2>
           <p>The Services are provided "AS IS," without warranty of any kind. Without limiting the foregoing, we explicitly disclaim any implied warranties of merchantability, fitness for a particular purpose, quiet enjoyment and non-infringement, and any warranties arising out of course of dealing or usage of trade.</p>

           <h2>9. Limitation of Liability</h2>
           <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, NEITHER PICK PACK SERVICES NOR ITS SERVICE PROVIDERS INVOLVED IN CREATING, PRODUCING, OR DELIVERING THE SERVICES WILL BE LIABLE FOR ANY INCIDENTAL, SPECIAL, EXEMPLARY OR CONSEQUENTIAL DAMAGES, OR DAMAGES FOR LOST PROFITS, LOST REVENUES, LOST SAVINGS, LOST BUSINESS OPPORTUNITY, LOSS OF DATA OR GOODWILL, SERVICE INTERRUPTION, COMPUTER DAMAGE OR SYSTEM FAILURE OR THE COST OF SUBSTITUTE SERVICES OF ANY KIND ARISING OUT OF OR IN CONNECTION WITH THESE TERMS OR FROM THE USE OF OR INABILITY TO USE THE SERVICES.</p>


          <h2>10. Governing Law</h2>
          <p>
             These Terms and any action related thereto will be governed by the laws of the [Your Jurisdiction, e.g., State of California] without regard to its conflict of laws provisions.
          </p>

           <h2>11. Contact Information</h2>
            <p>If you have any questions about these Terms or the Services, please contact us at support@pickpackservices.com.</p>

        </CardContent>
      </Card>
    </div>
  );
}
