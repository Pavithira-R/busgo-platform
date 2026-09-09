import Navbar from './Navbar'
import ChatBubble from './ChatBubble'
export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-6 pb-24">{children}</main>
      <ChatBubble />
    </div>
  )
}
