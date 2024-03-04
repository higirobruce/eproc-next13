"use client";
import {
  Grid,
  Typography,
  Col,
  Divider,
  Row,
  message,
  Input,
  Button,
  Tag,
  Segmented,
  List,
  Empty,
  Switch,
  Select,
  Modal,
  Spin,
  Popover,
  Popconfirm,
  Rate,
  Form,
} from "antd";
import Image from "next/image";
import React, { Suspense, useEffect, useState } from "react";
import VendorsTable from "../../components/vendorsTable";
import _ from "lodash";
import {
  ArrowLeftOutlined,
  BankOutlined,
  CheckOutlined,
  CompassOutlined,
  EditOutlined,
  EyeOutlined,
  FileTextOutlined,
  GiftOutlined,
  GlobalOutlined,
  HomeFilled,
  IdcardOutlined,
  LoadingOutlined,
  MailOutlined,
  PaperClipOutlined,
  PhoneOutlined,
  PlusOutlined,
  ReloadOutlined,
  SaveOutlined,
  SettingOutlined,
  UploadOutlined,
  UserOutlined,
} from "@ant-design/icons";
import moment from "moment";
import { motion } from "framer-motion";
import { useUser } from "@/app/context/UserContext";

export default function Vendors() {
  const { user, login, logout } = useUser();
  // let user = JSON.parse(localStorage.getItem("user"));
  let token = localStorage.getItem("token");
  const [passwordForm] = Form.useForm();
  const [dataLoaded, setDataLoaded] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  let url = process.env.NEXT_PUBLIC_BKEND_URL;
  let apiUsername = process.env.NEXT_PUBLIC_API_USERNAME;
  let apiPassword = process.env.NEXT_PUBLIC_API_PASSWORD;
  let [dataset, setDataset] = useState([]);
  let [tempDataset, setTempDataset] = useState([]);
  let [updatingId, setUpdatingId] = useState("");
  let [rowData, setRowData] = useState(null);
  let [segment, setSegment] = useState("Bids");
  let [vendorsBids, setVendorsBids] = useState([]);
  const [previewAttachment, setPreviewAttachment] = useState(false);
  const [attachmentId, setAttachmentId] = useState(null);
  const [editVendor, setEditVendor] = useState(false);
  let [servCategories, setServCategories] = useState([]);
  let [submitting, setSubmitting] = useState(false);

  const antIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />;

  let [searchStatus, setSearchStatus] = useState("all");
  let [searchText, setSearchText] = useState("");

  useEffect(() => {
    loadVendors();
    fetch(`${url}/serviceCategories`, {
      method: "GET",
      headers: {
        Authorization: "Basic " + window.btoa(`${apiUsername}:${apiPassword}`),
        token: token,
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((res) => {
        setServCategories(res);
      })
      .catch((err) => {
        messageApi.open({
          type: "error",
          content: "Connection Error!",
        });
      });
  }, []);

  useEffect(() => {
    if (searchText === "") {
      refresh();
    } else {
      let _dataSet = [...dataset];
      let filtered = _dataSet.filter((d) => {
        return (
          d?.vendor?.companyName
            ?.toString()
            .toLowerCase()
            .indexOf(searchText.toLowerCase()) > -1 ||
          d?.tin?.toString().indexOf(searchText.toLowerCase()) > -1
        );
      });
      setTempDataset(filtered);
      // else setTempDataset(dataset)
    }
  }, [searchText]);

  useEffect(() => {
    if (rowData) {
      fetch(`${url}/submissions/byVendor/${rowData?.vendor?._id}`, {
        method: "GET",
        headers: {
          Authorization:
            "Basic " + window.btoa(`${apiUsername}:${apiPassword}`),
          "Content-Type": "application/json",
        },
      })
        .then((res) => res.json())
        .then((res) => {
          setVendorsBids(res);
        })
        .catch((err) => {
          messageApi.open({
            type: "error",
            content: "Something happened! Please try again.",
          });
        });
    }
  }, [rowData]);

  useEffect(() => {
    setDataLoaded(false);
    let requestUrl = `${url}/users/vendors/byStatus/${searchStatus}/`;
    fetch(requestUrl, {
      method: "GET",
      headers: {
        Authorization: "Basic " + window.btoa(`${apiUsername}:${apiPassword}`),
        token: token,
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((res) => {
        setDataLoaded(true);
        setDataset(res);
        setTempDataset(res);
      })
      .catch((err) => {
        messageApi.open({
          type: "error",
          content: "Something happened! Please try again.",
        });
      });
  }, [searchStatus]);

  function refresh() {
    loadVendors();
  }

  function loadVendors() {
    setDataLoaded(false);
    fetch(`${url}/users/vendors`, {
      method: "GET",
      headers: {
        Authorization: "Basic " + window.btoa(`${apiUsername}:${apiPassword}`),
        token: token,
        "Content-Type": "application/json",
      },
    })
      .then((res) => {
        if (res.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          router.push("/auth");
        } else {
          return res.json();
        }
      })
      .then((res) => {
        setDataLoaded(true);
        setDataset(res);
        setTempDataset(res);
      })
      .catch((err) => {
        messageApi.open({
          type: "error",
          content: "Something happened! Please try again.",
        });
      });
  }
  useEffect(() => {
    setUpdatingId("");
  }, [dataset]);

  function approveUser(id) {
    setUpdatingId(id);
    fetch(`${url}/users/approve/${id}`, {
      method: "POST",
      headers: {
        Authorization: "Basic " + window.btoa(`${apiUsername}:${apiPassword}`),
        token: token,
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.error) {
          setUpdatingId(null);
          messageApi.open({
            type: "error",
            content: res.message,
          });
        } else {
          setUpdatingId(null);
          let _data = [...dataset];
          // Find item index using _.findIndex (thanks @AJ Richardson for comment)
          var index = _.findIndex(_data, { _id: id });
          let elindex = _data[index];
          elindex.status = "approved";

          // Replace item at index using native splice
          _data.splice(index, 1, elindex);

          setDataset(_data);
          setTempDataset(_data);
          setUpdatingId(null);
          messageApi.open({
            type: "success",
            content: "Successfully approved!",
          });
        }
      })
      .catch((err) => {
        messageApi.open({
          type: "error",
          content: "Something happened! Please try again.",
        });
      });
  }

  function declineUser(id) {
    setUpdatingId(id);
    fetch(`${url}/users/decline/${id}`, {
      method: "POST",
      headers: {
        Authorization: "Basic " + window.btoa(`${apiUsername}:${apiPassword}`),
        token: token,
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((res) => {
        let _data = [...dataset];

        // Find item index using _.findIndex (thanks @AJ Richardson for comment)
        var index = _.findIndex(_data, { _id: id });
        let elindex = _data[index];
        elindex.status = res?.status;

        // Replace item at index using native splice
        _data.splice(index, 1, elindex);

        setDataset(_data);
        setTempDataset(_data);
        setUpdatingId(null);
      })
      .catch((err) => {
        setUpdatingId(null);
        messageApi.open({
          type: "error",
          content: "Something happened! Please try again.",
        });
      });
  }

  function banVendor(id) {
    setUpdatingId(id);
    fetch(`${url}/users/ban/${id}`, {
      method: "POST",
      headers: {
        Authorization: "Basic " + window.btoa(`${apiUsername}:${apiPassword}`),
        token: token,
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((res) => {
        let _data = [...dataset];

        // Find item index using _.findIndex (thanks @AJ Richardson for comment)
        var index = _.findIndex(_data, { _id: id });
        let elindex = _data[index];
        elindex.status = res?.status;

        // Replace item at index using native splice
        _data.splice(index, 1, elindex);

        setDataset(_data);
        setTempDataset(_data);
      })
      .catch((err) => {
        messageApi.open({
          type: "error",
          content: "Something happened! Please try again.",
        });
      });
  }

  function activateVendor(id) {
    setUpdatingId(id);
    fetch(`${url}/users/activate/${id}`, {
      method: "POST",
      headers: {
        Authorization: "Basic " + window.btoa(`${apiUsername}:${apiPassword}`),
        token: token,
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((res) => {
        let _data = [...dataset];

        // Find item index using _.findIndex (thanks @AJ Richardson for comment)
        var index = _.findIndex(_data, { _id: id });
        let elindex = _data[index];
        elindex.status = res?.status;

        // Replace item at index using native splice
        _data.splice(index, 1, elindex);

        setDataset(_data);
        setTempDataset(_data);
      })
      .catch((err) => {
        messageApi.open({
          type: "error",
          content: "Something happened! Please try again.",
        });
      });
  }

  function updateVendor() {
    fetch(`${url}/users/${rowData?.vendor?._id}`, {
      method: "PUT",
      headers: {
        Authorization: "Basic " + window.btoa(`${apiUsername}:${apiPassword}`),
        token: token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        newUser: rowData?.vendor,
      }),
    })
      .then((res) => res.json())
      .then((res) => {
        refresh();
      })
      .catch((err) => {
        messageApi.open({
          type: "error",
          content: "Something happened! Please try again.",
        });
      });
  }

  function updatePassword() {
    setSubmitting(true);

    fetch(`${url}/users/reset/${rowData?.vendor?.email}`, {
      method: "PUT",
      headers: {
        Authorization: "Basic " + window.btoa(`${apiUsername}:${apiPassword}`),
        token: token,
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((res) => {
        messageApi.open({
          type: "info",
          content: "Vendor password was successfully reset",
        });
        refresh();
      })
      .catch((err) => {
        messageApi.open({
          type: "error",
          content: "Something happened! Please try again.",
        });
      })
      .finally(() => {
        setSubmitting(false);
      });
  }

  return (
    <>
      {contextHolder}
      {
        <div className="flex flex-col transition-opacity ease-in-out duration-1000 flex-1 space-y-1 h-full">
          <Row className="flex flex-col custom-sticky space-y-2 bg-white px-10 py-3 shadow">
            <div className="flex flex-row justify-between items-center">
              <div className="text-xl font-semibold">Vendors List</div>
            </div>

            <Row className="flex flex-row space-x-5 items-center justify-between">
              <div className="flex-1">
                <Select
                  // mode="tags"
                  style={{ width: "300px" }}
                  placeholder="Select status"
                  onChange={(value) => setSearchStatus(value)}
                  value={searchStatus}
                  options={[
                    { value: "all", label: "All" },
                    {
                      value: "pending-approval",
                      label: "Pending approval",
                    },
                    {
                      value: "approved",
                      label: "Approved",
                    },
                    {
                      value: "rejected",
                      label: "Rejected",
                    },
                  ]}
                />
              </div>
              <div className="z-0">
                <Input.Search
                  autoFocus
                  style={{ width: "300px" }}
                  onChange={(e) => {
                    setSearchText(e?.target?.value);
                  }}
                  placeholder="Search by vendor name, TIN"
                />
              </div>
              <Button
                type="text"
                icon={<ReloadOutlined />}
                onClick={() => refresh()}
              ></Button>
            </Row>
          </Row>

          {/* <Row className="flex flex-row justify-between items-center">
            <div className="flex flex-row items-start space-x-5 w-1/4">
              <div className="text-xl font-semibold">Vendors List</div>
             
            </div>
            <Row className="flex flex-row space-x-5 items-center">
              <div>
                <Input.Search placeholder="Search vendors" />
              </div>
              <Button
                type="text"
                icon={<ReloadOutlined />}
                onClick={() => refresh()}
              ></Button>
              <Button type="text" icon={<SettingOutlined />}></Button>
            </Row>
          </Row> */}

          <Suspense
            fallback={
              <div className="flex items-center justify-center flex-1 h-screen">
                <Spin
                  indicator={
                    <LoadingOutlined
                      className="text-gray-500"
                      style={{ fontSize: 42 }}
                      spin
                    />
                  }
                />
              </div>
            }
          >
            <Row className="flex flex-row space-x-5 mx-10 pt-5">
              <motion.div
                className="w-full"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: tempDataset && tempDataset?.length >= 1 ? 1 : 0,
                }}
                transition={{
                  duration: 0.3,
                  type: "tween",
                  ease: "circOut",
                }}
              >
                <Col flex={4}>
                  <VendorsTable
                    dataSet={tempDataset}
                    handleApproveUser={approveUser}
                    handleDeclineUser={declineUser}
                    updatingId={updatingId}
                    handleBanUser={banVendor}
                    handleActivateUser={activateVendor}
                    handleSetRow={setRowData}
                  />
                </Col>
              </motion.div>
              {/* <Col flex={1}><OverviewWindow/></Col> */}
            </Row>
          </Suspense>
          <div class="absolute -bottom-20 right-10 opacity-10">
            <Image src="/icons/blue icon.png" width={110} height={100} />
          </div>
        </div>
      }
    </>
  );

  function previewAttachmentModal() {
    // return (
    //   <Modal
    //     title="Attachment view"
    //     centered
    //     open={previewAttachment}
    //     onOk={() => setPreviewAttachment(false)}
    //     onCancel={() => setPreviewAttachment(false)}
    //     width={"80%"}
    //     // bodyStyle={{ maxHeight: "700px", overflow: "scroll" }}
    //   >
    //     <div>
    //       <MyPdfViewer fileUrl={`${url}/file/${attachmentId}`} />
    //     </div>
    //   </Modal>
    // );
  }
}
