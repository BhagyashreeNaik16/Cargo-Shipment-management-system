import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-secondary text-secondary-foreground py-6">
      <div className="container mx-auto text-center text-sm">
        <p>&copy; {new Date().getFullYear()} PICK PACK SERVICES. All rights reserved.</p>
        <div className="mt-2 space-x-4">
          <Link href="/privacy" className="hover:text-accent">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-accent">Terms of Service</Link>
        </div>
      </div>
    </footer>
  );
}
