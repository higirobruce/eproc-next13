'use client'
import React, { useEffect, useState } from "react";
import {
  CopyOutlined,
  DollarOutlined,
  FileDoneOutlined,
  LogoutOutlined,
  MessageOutlined,
  OrderedListOutlined,
  PieChartOutlined,
  SolutionOutlined,
  UsergroupAddOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Menu } from "antd";
import {useRouter, usePathname} from "next/navigation";
import { useRouter as nextRouter } from "next/router";
import Image from "next/image";

const SideMenu = ({ setScreen, screen, user }) => {
  let pathName = usePathname();
  let router = useRouter()
  const [current, setCurrent] = useState(pathName.substring(1));
  const [items, setItems] = useState([]);
  useEffect(() => {}, [screen]);
  
  console.log(pathName)
  let parts = pathName.split('/')
  if(parts.length>=3){
    pathName = `/${parts[1]}/${parts[2]}`
  }
  console.log(parts)
  useEffect(()=>{
    setCurrent(pathName.substring(1))
  },[pathName])

  useEffect(() => {
    let _items = [];
    if (user?.userType !== "VENDOR") {
      _items = [];
      if (user?.permissions?.canViewDashboard) {
        _items.push({
          label: "Dashboard",
          key: "system/dashboard",
          icon: <PieChartOutlined />,
        });
      }

      if (user?.permissions?.canViewRequests) {
        _items.push({
          label: "Purchase Requests",
          key: "system/requests",
          icon: <SolutionOutlined />,
        });
      }

      if (user?.permissions?.canViewTenders) {
        _items.push({
          label: "Tenders",
          key: "system/tenders",
          icon: <MessageOutlined />,
        });
      }

      if (user?.permissions?.canViewContracts) {
        _items.push({
          label: "Contracts",
          key: "system/contracts",
          icon: <FileDoneOutlined />,
        });
      }

      if (user?.permissions?.canViewPurchaseOrders) {
        _items.push({
          label: "Purchase Orders",
          key: "system/purchase-orders",
          icon: <OrderedListOutlined />,
        });
      }

      _items.push({
        label: "Payment requests",
        key: "system/payment-requests",
        icon: <DollarOutlined />,
      });

      if (user?.permissions?.canViewPurchaseOrders) {
        
      }

      if (user?.permissions?.canViewVendors) {
        _items.push({
          label: "Vendors",
          key: "system/vendors",
          icon: <UsergroupAddOutlined />,
        });
      }
      

      if (user?.permissions?.canViewUsers) {
        _items.push({
          type: "divider",
        });

        _items.push({
          label: "Internal Users",
          key: "system/users",
          icon: <UserOutlined />,
        },)
      }

      


    } else {
      _items = [
        {
          label: "Tenders",
          key: "system/tenders",
          icon: <MessageOutlined />,
        },
        {
          label: "My Contracts",
          key: "system/contracts",
          icon: <FileDoneOutlined />,
        },
        {
          label: "My Purchase Orders",
          key: "system/purchase-orders",
          icon: <OrderedListOutlined />,
        },
        {
          label: "My Payment requests",
          key: "system/payment-requests",
          icon: <DollarOutlined />,
        }
        // {
        //   key: "logout",
        //   label:"Logout",
        //   danger: true,
        //   icon: <LogoutOutlined className="text-red-400" />,
        //   // style: { marginTop: "780px", color:"#F97B7B"},
        //   // onClick: logout,
        // },
      ];
    }

    setItems(_items);
  }, []);

  const logout = () => {
    localStorage.removeItem("user");
    router.push("/auth");
  };
  const onClick = (e) => {
    if (e.key === "logout") {
      logout();
    } else {
      router.push(`${e.key}`)
      // setScreen(e.key);
    }
    setCurrent(e.key);
  };

  return (
    <Menu
      onClick={onClick}
      className="h-full"
      style={{
        // height: "100%",
        // borderRight: 0,
      }}
      selectedKeys={[current]}
      mode="vertical"
      items={items}
    />
  );
};

export default SideMenu;
