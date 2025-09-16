export function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 px-4 py-3">
      <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-gray-600">
        <p>&copy; 2024 Inventory Dashboard. All rights reserved.</p>
        <div className="flex space-x-4 mt-2 sm:mt-0">
          <a href="#" className="hover:text-gray-900">Support</a>
          <a href="#" className="hover:text-gray-900">Privacy</a>
          <a href="#" className="hover:text-gray-900">Terms</a>
        </div>
      </div>
    </footer>
  );
}