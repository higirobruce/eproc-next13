"use client";
import { LoadingOutlined } from "@ant-design/icons";
import { Button, Divider, Empty, Layout, Spin } from "antd";
import SideMenu from "../components/sideMenu";
import TopMenu from "../components/topMenu";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LockClosedIcon } from "@heroicons/react/24/solid";
import { useUser } from "../context/UserContext";

export default function SystemLayout({ children }) {
  const { user, login, logout } = useUser();
  let [screen, setScreen] = useState("");
  let [loggedInUser, setLoggedInUser] = useState(null);
  let [loggingOut, setLoggingOut] = useState(false);
  let [token, setToken] = useState("");
  let [current, setCurrent] = useState("");
  let router = useRouter();

  let pathName = usePathname();
  useEffect(() => {
    setLoggedInUser(user);
    // let user = JSON.parse(localStorage.getItem("user"));
    setToken(localStorage.getItem("token"));
    if (user?.userType !== "VENDOR") setScreen("dashboard");
    else setScreen("tenders");
  }, []);

  // let parts = pathName.split('/')
  // if(parts.length>=3){
  //   pathName = `/${parts[1]}/${parts[2]}`
  // }
  // console.log(parts)
  useEffect(() => {
    setCurrent(pathName.substring(1));
  }, [pathName]);
  return (
    <main>
      {loggedInUser && token?.length >= 1 && (
        <div className="flex flex-col">
          <TopMenu screen={screen} handleLogout={(v) => setLoggingOut(v)} />
          <Layout>
            <div className="hidden md:flex ">
              <Layout.Sider width={200}>
                <SideMenu
                  user={loggedInUser}
                  className="h-screen fixed top-0"
                />
              </Layout.Sider>
            </div>
            <Layout>
              <Layout.Content className="bg-gray-50 h-full z-0">
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

      {(!loggedInUser || !token) && (
        <div className="flex flex-col items-center justify-center h-screen w-full">
          {/* <Empty
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
          </Empty> */}
          <LockClosedIcon className="h-24 w-24 text-gray-300" />
          <span
            className="cursor-pointer hover:underline text-blue-500 font-thin"
            onClick={() => router.push(`/auth?goTo=${pathName}`)}
          >
            Sorry, you need to login first!
          </span>
        </div>
      )}
    </main>
  );
}
