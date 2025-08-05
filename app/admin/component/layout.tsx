"use client"
import React, { useState, useEffect, useMemo } from 'react';
import { Target, RefreshCwOff, Proportions, HandCoins, BookCheck, CircleUserRound } from 'lucide-react';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { Layout, Menu, theme } from 'antd';
import type { MenuProps } from 'antd';
import logo from "./../../../public/logo.jpeg"
import Image from 'next/image';
import Link from 'next/link';

// Lazy load content components
const Home = React.lazy(() => import('./Home'));
const CancelSellApproval = React.lazy(() => import('./CancelSellApproval'));
const AddProductPage = React.lazy(() => import('./AddProduct'));
const SellReportAdmin = React.lazy(() => import('./SellReport'));
const CreditReport = React.lazy(() => import('./CreditReport'));
import AddNewUser from './AddNewUser';

const { Header, Sider, Content } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

const DashboardLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedKey, setSelectedKey] = useState('1');
  const [isSiderVisible, setIsSiderVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      
      if (mobile && !isMobile) {
        setIsSiderVisible(false);
      } else if (!mobile) {
        setIsSiderVisible(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile]);

  const handleMenuClick: MenuProps['onClick'] = (e) => {
    setSelectedKey(e.key);
    if (isMobile) {
      setIsSiderVisible(false);
    }
  };

  const toggleMobileSider = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSiderVisible(!isSiderVisible);
  };

  const toggleDesktopSider = () => {
    setCollapsed(!collapsed);
  };

  // Memoize menu items to prevent unnecessary re-renders
  const menuItems = useMemo<MenuItem[]>(() => [
    {
      key: '1',
      icon: <Target size={20} aria-hidden="true" />,
      label: 'Overview',
    },
    {
      key: '2',
      icon: <RefreshCwOff size={20} aria-hidden="true" />,
      label: 'Cancel Sell',
    },
    {
      key: '3',
      icon: <Proportions size={20} aria-hidden="true" />,
      label: 'Sell Report',
    },
    {
      key: '4',
      icon: <HandCoins size={20} aria-hidden="true" />,
      label: 'Credit Report',
    },
    {
      key: '5',
      icon: <BookCheck size={20} aria-hidden="true" />,
      label: 'Add Product',
    },
    {
      key: '6',
      icon: <CircleUserRound size={20} aria-hidden="true" />,
      label: 'Add User',
    },
  ], []);

  const profileItem = useMemo<MenuItem>(() => ({
    key: '7',
    icon: <CircleUserRound size={20} color='orange' aria-hidden="true" />,
    label: <span className="text-orange-300">Profile</span>,
    className: 'profile-menu-item'
  }), []);

  const getContentComponent = () => {
    switch (selectedKey) {
      case '1': return <Home setSelectedKey={setSelectedKey} />;
      case '2': return <CancelSellApproval />;
      case '3': return <SellReportAdmin />;
      case '4': return <CreditReport />;
      case '5': return <AddProductPage />;
      case '6': return <AddNewUser />;
      default: return <Home setSelectedKey={setSelectedKey} />;
    }
  };

  const getPageTitle = () => {
    switch (selectedKey) {
      case '1': return 'Overview';
      case '2': return 'Cancel Sell';
      case '3': return 'Sell Report';
      case '4': return 'Credit Report';
      case '5': return 'Add Product';
      case '6': return 'Add User';
      case '7': return 'Profile';
      default: return '';
    }
  };
   function handleLogout() {
    
     // Perform logout logic here
   }

  return (
    <Layout className="min-h-screen">
      {isMobile && isSiderVisible && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-15 backdrop-blur-sm z-20"
          onClick={() => setIsSiderVisible(false)}
          role="presentation"
        />
      )}

      <Sider
        trigger={null}
        collapsible
        collapsed={isMobile ? false : collapsed}
        className={`
          ${isMobile ? 'fixed z-30 h-full' : 'relative'} 
          ${isSiderVisible || !isMobile ? 'block' : 'hidden'} 
          min-h-screen transition-all duration-300
        `}
        style={{ backgroundColor: '#2563eb' }}
        width={200}
        collapsedWidth={isMobile ? 0 : 80}
        aria-label="Main navigation"
      >
        <div className='bg-white w-full flex justify-center items-center'>
          <Image 
            src={logo} 
            width={isMobile ? 100 : collapsed ? 50 : 100} 
            alt='Company logo' 
            height={isMobile ? 80 : collapsed ? 50 : 80} 
            className="object-contain py-2" 
            priority
          />
        </div>
        
        <Menu
          theme="dark"
          mode="inline"
          style={{ backgroundColor: '#2563eb' }}
          defaultSelectedKeys={['1']}
          selectedKeys={[selectedKey]}
          onClick={handleMenuClick}
          items={menuItems}
          role="navigation"
        />
        
        <div className='absolute bottom-0 left-0 right-0'>
          <Menu
            theme="dark"
            mode="inline"
            style={{ backgroundColor: '#2563eb' }}
            selectedKeys={[selectedKey]}
            onClick={handleMenuClick}
            items={[profileItem]}
          />
        </div>
      </Sider>

      <Layout>
        <Header
          className="sticky top-0 z-10 w-full flex items-center justify-between shadow-sm"
          style={{
            background: colorBgContainer,
            padding: '0 16px',
            height: '64px',
          }}
        >
          <button
            onClick={isMobile ? toggleMobileSider : toggleDesktopSider}
            className="text-blue-600 hover:text-blue-800 flex items-center justify-center"
            aria-label="Toggle menu"
          >
            {isMobile ? 
              (isSiderVisible ? 
                <MenuFoldOutlined style={{ fontSize: 24 }} /> : 
                <MenuUnfoldOutlined style={{ fontSize: 24 }} />) : 
              
              (collapsed ? 
                <MenuUnfoldOutlined style={{ fontSize: 24 }} /> : 
                <MenuFoldOutlined style={{ fontSize: 24 }} />)
            }
          </button>
          
          <div className="ml-4 text-lg font-medium flex-1">
            {getPageTitle()}
          </div>
          
          <Link href="/" passHref>
            <button 
              className="text-blue-600 hover:text-blue-800"
              aria-label="Switch to Sell panel"
            >
              Switch to sell
            </button>
          </Link>
            <button 
              className="text-blue-600 hover:text-blue-800"
              aria-label="Switch to Sell panel"

            >
              Logout
            </button>
        </Header>

        <Content
          className="p-4 sm:p-6 overflow-x-auto hide-scrollbar"
          style={{
            margin: isMobile ? '8px' : '16px',
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            minHeight: "calc(100vh - 64px - 32px)",
          }}
        >
          <React.Suspense fallback={<div>Loading...</div>}>
            {getContentComponent()}
          </React.Suspense>
        </Content>
      </Layout>
    </Layout>
  );
};

export default DashboardLayout;