import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  FiMenu, FiX, FiHome, FiGrid, FiUser, FiSettings, 
  FiChevronRight, FiArrowLeft 
} from 'react-icons/fi';

const ResponsiveContainer = ({ children, className = '' }) => {
  return (
    <div className={`w-full overflow-x-hidden px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 mx-auto sm:max-w-[640px] md:max-w-[768px] lg:max-w-[1024px] xl:max-w-[1366px] ${className}`}>
      {children}
    </div>
  );
};

const ResponsiveGrid = ({ children, cols = 1, gap = 4, className = '' }) => {
  const gridColsMap = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  };

  const gapMap = {
    2: 'gap-2',
    3: 'gap-3',
    4: 'gap-4',
    5: 'gap-5',
    6: 'gap-6',
    8: 'gap-8',
  };

  const colsClass = gridColsMap[cols] || gridColsMap[1];
  const gapClass = gapMap[gap] || 'gap-4';

  return (
    <div className={`grid ${colsClass} ${gapClass} ${className}`}>
      {children}
    </div>
  );
};

const ResponsiveTypography = {
  H1: ({ children, className = '' }) => (
    <h1 className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight ${className}`}>
      {children}
    </h1>
  ),
  H2: ({ children, className = '' }) => (
    <h2 className={`text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold ${className}`}>
      {children}
    </h2>
  ),
  H3: ({ children, className = '' }) => (
    <h3 className={`text-lg sm:text-xl md:text-2xl lg:text-3xl font-medium ${className}`}>
      {children}
    </h3>
  ),
  Subtitle: ({ children, className = '' }) => (
    <p className={`text-base md:text-lg font-medium ${className}`}>
      {children}
    </p>
  ),
  Body: ({ children, className = '' }) => (
    <p className={`text-base md:text-lg leading-relaxed ${className}`}>
      {children}
    </p>
  ),
  Small: ({ children, className = '' }) => (
    <span className={`text-sm md:text-base ${className}`}>
      {children}
    </span>
  ),
  Caption: ({ children, className = '' }) => (
    <span className={`text-sm text-gray-500 ${className}`}>
      {children}
    </span>
  ),
};

const Breadcrumbs = ({ items = [], className = '' }) => {
  if (items.length === 0) return null;
  
  return (
    <nav className={`hidden md:flex items-center space-x-2 text-base text-gray-600 ${className}`}>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && <FiChevronRight className="h-4 w-4 text-gray-400" />}
          {item.href && index < items.length - 1 ? (
            <Link 
              to={item.href} 
              className="hover:text-primary-600 transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className={index === items.length - 1 ? 'text-gray-900 font-medium' : ''}>
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

const BackButton = ({ onClick, className = '' }) => {
  const navigate = useNavigate();
  
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(-1);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center gap-2 px-3 py-2.5 text-gray-700 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors ${className}`}
      aria-label="Go back"
    >
      <FiArrowLeft className="h-5 w-5" />
      <span className="text-base font-medium">Kembali</span>
    </button>
  );
};

const ResponsiveHeader = ({ 
  logo, 
  navItems = [], 
  actions, 
  showMenuButton = false,
  onMenuClick,
  className = '' 
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const defaultNavItems = [
    { label: 'Home', href: '/', icon: <FiHome /> },
    { label: 'Products', href: '/products', icon: <FiGrid /> },
    { label: 'Profile', href: '/profile', icon: <FiUser /> },
    { label: 'Settings', href: '/settings', icon: <FiSettings /> },
  ];

  const items = navItems.length > 0 ? navItems : defaultNavItems;

  const isActive = (href) => location.pathname === href;

  return (
    <header className={`bg-white shadow-md sticky top-0 md:fixed md:top-0 md:left-0 md:right-0 z-50 ${className}`}>
      <ResponsiveContainer>
        <div className="flex justify-between items-center h-14 sm:h-16 md:h-18 lg:h-20">
          <div className="flex items-center gap-2">
            {showMenuButton && (
              <button
                onClick={onMenuClick}
                className="lg:hidden min-h-[44px] min-w-[44px] p-3 text-gray-700 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center"
                aria-label="Toggle sidebar"
              >
                <FiMenu className="h-6 w-6" />
              </button>
            )}
            <div className="flex-shrink-0">
              {logo || (
                <Link to="/" className="text-lg sm:text-xl md:text-2xl font-bold text-primary-600">
                  Logo
                </Link>
              )}
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-2 lg:space-x-4 xl:space-x-6">
            {items.map((item, index) => (
              <Link
                key={index}
                to={item.href}
                className={`min-h-[44px] flex items-center px-3 lg:px-4 py-3 text-base font-medium transition-colors rounded-md ${
                  isActive(item.href)
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                }`}
              >
                {item.icon && <span className="mr-1 lg:mr-2">{item.icon}</span>}
                {item.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center space-x-2 lg:space-x-4">
            {actions}
          </div>

          <button
            className="md:hidden min-h-[44px] min-w-[44px] p-3 text-gray-700 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <FiX className="h-6 w-6" />
            ) : (
              <FiMenu className="h-6 w-6" />
            )}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden border-t bg-white pb-4">
            <div className="pt-2 space-y-1">
              {items.map((item, index) => (
                <Link
                  key={index}
                  to={item.href}
                  className={`min-h-[44px] flex items-center px-4 py-3 text-base font-medium transition-colors ${
                    isActive(item.href)
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.icon && <span className="mr-3">{item.icon}</span>}
                  {item.label}
                </Link>
              ))}
            </div>
            {actions && (
              <div className="mt-4 px-4 space-y-2">
                {actions}
              </div>
            )}
          </div>
        )}
      </ResponsiveContainer>
    </header>
  );
};

const ResponsiveSidebar = ({ 
  isOpen, 
  onClose, 
  children, 
  className = '' 
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-40 transform transition-transform duration-300 
          lg:translate-x-0 lg:top-[72px] lg:h-[calc(100vh-72px)]
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          ${className}`}
      >
        <div className="lg:hidden flex justify-end p-4 border-b">
          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] p-3 text-gray-700 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center"
            aria-label="Close sidebar"
          >
            <FiX className="h-6 w-6" />
          </button>
        </div>
        
        <div className="h-full overflow-y-auto">
          {children}
        </div>
      </aside>
    </>
  );
};

const ResponsiveFooter = ({ className = '' }) => {
  return (
    <footer className={`bg-gray-900 text-gray-300 py-6 sm:py-8 md:py-10 lg:py-12 ${className}`}>
      <ResponsiveContainer>
        <div className="text-center text-base">
          <p>&copy; {new Date().getFullYear()} SelempangKu. All rights reserved.</p>
        </div>
      </ResponsiveContainer>
    </footer>
  );
};

const ResponsiveLayout = ({ 
  children, 
  showSidebar = false,
  sidebarContent = null,
  mobileMenuItems = [],
  showHeader = true,
  showFooter = true,
  headerProps = {},
  breadcrumbs = [],
  showBackButton = false,
  onBackClick,
  className = '' 
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className={`min-h-screen overflow-x-hidden bg-gray-50 flex flex-col ${className}`}>
      {showHeader && (
        <ResponsiveHeader 
          {...headerProps}
          navItems={headerProps.navItems || mobileMenuItems}
          showMenuButton={showSidebar}
          onMenuClick={toggleSidebar}
        />
      )}
      
      <div className="flex flex-1 overflow-x-hidden">
        {showSidebar && (
          <ResponsiveSidebar 
            isOpen={isSidebarOpen} 
            onClose={closeSidebar}
          >
            {sidebarContent}
          </ResponsiveSidebar>
        )}
        
        <main 
          className={`flex-1 transition-all duration-300 overflow-x-hidden
            ${showSidebar ? 'lg:ml-64' : ''}
            ${showHeader ? 'md:pt-[72px]' : ''}
          `}
        >
          <div className="p-4 sm:p-6 md:p-8 lg:p-10 break-words">
            {showBackButton && (
              <BackButton onClick={onBackClick} className="mb-4" />
            )}
            
            {breadcrumbs.length > 0 && (
              <Breadcrumbs items={breadcrumbs} className="mb-4 md:mb-6" />
            )}
            
            {children}
          </div>
        </main>
      </div>
      
      {showFooter && <ResponsiveFooter />}
    </div>
  );
};

const ResponsiveImage = ({ src, alt, className = '', ...props }) => {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={`max-w-full h-auto ${className}`}
      {...props}
    />
  );
};

const ResponsiveTableWrapper = ({ children, className = '' }) => {
  return (
    <div className={`overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 ${className}`}>
      {children}
    </div>
  );
};

export {
  ResponsiveLayout,
  ResponsiveContainer,
  ResponsiveGrid,
  ResponsiveTypography,
  ResponsiveHeader,
  ResponsiveSidebar,
  ResponsiveFooter,
  Breadcrumbs,
  BackButton,
  ResponsiveImage,
  ResponsiveTableWrapper,
};

export default ResponsiveLayout;
