import './globals.css';
import { ReduxProvider } from '../redux/providers';
import { AuthProvider } from '../context/AuthContext';
import { SocketProvider } from '../context/SocketContext';

export const metadata = {
    title: 'ChatFlow | Realtime WebSockets Chat App',
    description: 'Modern real-time chat website powered by WebSockets, Express, MongoDB, and Next.js featuring request authorization & instant messaging.',
};

export const viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    viewportFit: 'cover',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>
                <ReduxProvider>
                    <AuthProvider>
                        <SocketProvider>
                            {children}
                        </SocketProvider>
                    </AuthProvider>
                </ReduxProvider>
            </body>
        </html>
    );
}


