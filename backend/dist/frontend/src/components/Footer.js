const Footer = () => {
    return (<footer className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">📚 Bookstore</h3>
            <p className="text-gray-300">
              Your one-stop destination for all your reading needs.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-gray-300">
              <li><a href="/books" className="hover:text-white transition-colors">Browse Books</a></li>
              <li><a href="/orders" className="hover:text-white transition-colors">My Orders</a></li>
              <li><a href="/cart" className="hover:text-white transition-colors">Shopping Cart</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <p className="text-gray-300">
              Email: support@bookstore.com<br />
              Phone: (555) 123-4567
            </p>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-300">
          <p>&copy; 2024 Bookstore. All rights reserved.</p>
        </div>
      </div>
    </footer>);
};
export default Footer;
//# sourceMappingURL=Footer.js.map