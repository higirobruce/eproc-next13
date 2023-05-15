'use client'
import { LoadingOutlined } from "@ant-design/icons";
import { Button, Divider, Empty, Layout, Spin } from "antd";
import SideMenu from "../components/sideMenu";
import TopMenu from "../components/topMenu";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function SystemLayout({ children }) {
  let [screen, setScreen] = useState("");
  let [loggedInUser, setLoggedInUser] = useState(null);
  let [loggingOut, setLoggingOut] = useState(false);
  let router = useRouter()

  useEffect(() => {
    setLoggedInUser(localStorage.getItem("user"));
    let user = JSON.parse(localStorage.getItem("user"));
    if (user?.userType !== "VENDOR") setScreen("dashboard");
    else setScreen("tenders");
  }, []);
  return (
    <main>
      {loggedInUser && (
        <div className="flex flex-col h-full min-h-screen">
          <TopMenu
            screen={screen}
            handleLogout={(v) => setLoggingOut(v)}
          />
          <Layout>
            <div className="hidden md:flex">
              <Layout.Sider width={200}>
                <SideMenu
                  user={JSON.parse(loggedInUser)}
                />
              </Layout.Sider>
            </div>
            <Layout>
              <Layout.Content className="bg-gray-100 h-full overflow-y-scroll">
                <Spin
                  spinning={loggingOut}
                  indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />}
                >
                  {children}
                </Spin>
              </Layout.Content>
            </Layout>
          </Layout>
        </div>
      )}

      {!loggedInUser && (
        <div className="flex flex-row items-center justify-center h-screen w-full">
          <Empty
            image="https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg"
            imageStyle={{
              height: 60,
            }}
            description={
              <span>Oups! You are not authorized to access the app!</span>
            }
          >
            <div>
              <Button type="link" onClick={() => router.push("/auth/signup")}>
                Sign up
              </Button>
              <Divider plain>Or</Divider>
              <Button type="link" onClick={() => router.push("/auth")}>
                Login
              </Button>
            </div>
          </Empty>
        </div>
      )}
    </main>
  );
}
