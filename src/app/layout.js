// PATH: /src/app/layout.js

import '../styles/globals.css';
import '../styles/form.css';
import '../styles/sp_steps.css';

export const metadata = {
  title: 'CommuniServe',
  description: 'Local Workforce Platform — Anini-y, Antique',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}