"use client";
import {
  ArrowLeftOutlined,
  BackwardOutlined,
  EditOutlined,
  EyeOutlined,
  LoadingOutlined,
  PlusOutlined,
  ReloadOutlined,
  SaveOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import {
  Button,
  DatePicker,
  Form,
  Modal,
  Row,
  Typography,
  message,
  Input,
  Select,
  Checkbox,
  Radio,
  Spin,
  Switch,
} from "antd";
import moment from "moment/moment";
import Image from "next/image";
import React, { useState, useEffect, useRef } from "react";
import ItemsTable from "../../components/itemsTable";
import RequestDetails from "../../components/requestDetails";
import UsersRequestsTable from "../../components/userRequestsTable";
import { useRouter } from "next/navigation";
import { encode } from "base-64";
import { motion } from "framer-motion";
import { useUser } from "@/app/context/UserContext";

export default function UserRequests() {
  const { user, login, logout } = useUser();
  let router = useRouter();
  const [serviceCategories, setServiceCategories] = useState([]);
  let [serviceCategory, setServiceCategory] = useState("");
  let [budgetLines, setBudgetLines] = useState([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  let url = process.env.NEXT_PUBLIC_BKEND_URL;
  let apiUsername = process.env.NEXT_PUBLIC_API_USERNAME;
  let apiPassword = process.env.NEXT_PUBLIC_API_PASSWORD;
  
  // let user = JSON.parse(localStorage.getItem("user"));
  let [dataset, setDataset] = useState([]);
  let [tempDataset, setTempDataset] = useState([]);
  let [updatingId, setUpdatingId] = useState("");
  const [open, setOpen] = useState(false);
  let [title, setTitle] = useState("");
  let [confirmLoading, setConfirmLoading] = useState(false);
  const [values, setValues] = useState([]);

  let [dueDate, setDueDate] = useState(null);
  let [description, setDescription] = useState("");
  let [rowData, setRowData] = useState(null);
  let [loadingRowData, setLoadingRowData] = useState(false);
  let [confirmRejectLoading, setConfirmRejectLoading] = useState(false);
  let [budgeted, setBudgeted] = useState(true);
  let [budgetLine, setBudgetLine] = useState("");
  let [reload, setReload] = useState(false);
  let [fileList, setFileList] = useState([]);
  let [level1Approvers, setLevel1Approvers] = useState([]);
  let [level1Approver, setLevel1Approver] = useState("");
  let [defaultApprover, setDefaultApprover] = useState({});
  const [editRequest, setEditRequest] = useState(false);

  let [searchStatus, setSearchStatus] = useState("all");
  let [searchText, setSearchText] = useState("");
  const [form] = Form.useForm();
  const [onlyMine, setOnlyMine] = useState(
    !user?.permissions?.canApproveAsHof &&
      !user?.permissions?.canApproveAsPM &&
      !user?.permissions?.canApproveAsHod
      ? true
      : false
  );
  const [myPendingRequest, setMyPendingRequest] = useState(false);
  const [currentUser, setCurrentUser] = useState("");
  const [sourcingMethod, setSourcingMethod] = useState("");
  let [files, setFiles] = useState([]);
  let token = localStorage.getItem("token");

  useEffect(() => {

    if (user?.userType == "VENDOR") {
      router.push("system/tenders");
    } else {
      // loadRequests()
    //   .then((res) => res.json())
    //   .then((res) => {
    //     setDataLoaded(true);
    //     setDataset(res);
    //     setTempDataset(res);
    //   })
    //   .catch((err) => {
    //     messageApi.open({
    //       type: "error",
    //       content: "Something happened! Please try again.",
    //     });
    //   });
    fetch(`${url}/serviceCategories`, {
      method: "GET",
      headers: {
        Authorization: "Basic " + encode(`${apiUsername}:${apiPassword}`),
        token: token,
        "Content-Type": "application/json",
      },
    })
      .then((res) => getResultFromServer(res))
      .then((res) => {
        setServiceCategories(res);
      })
      .catch((err) => {
        messageApi.open({
          type: "error",
          content:
            "Something happened fetching service categories! Please try again.",
        });
      });

    fetch(`${url}/users/${user?._id}`, {
      method: "GET",
      headers: {
        Authorization: "Basic " + encode(`${apiUsername}:${apiPassword}`),
        token: token,
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((res) => setCurrentUser(res))
      .catch((err) => {
        console.log(err);
        messageApi.open({
          type: "error",
          content: "Something happened fetching users! Please try again.",
        });
      });

    fetch(`${url}/users/level1Approvers`, {
      method: "GET",
      headers: {
        Authorization: "Basic " + encode(`${apiUsername}:${apiPassword}`),
        token: token,
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((res) => {
        let approversList = res?.filter((a) => a?._id !== user?._id);
        setLevel1Approvers(approversList);
        let hod = approversList?.filter(
          (a) => a?.department?._id === user?.department
        );

        setLevel1Approver(hod[0]?._id);

        setDefaultApprover(
          hod?.length >= 1
            ? {
                value: hod[0]?._id,
                label: hod[0].firstName + " " + hod[0].lastName,
              }
            : approversList[0]
        );
      })
      .catch((err) => {
        messageApi.open({
          type: "error",
          content: "Something happened fetching approvers! Please try again.",
        });
      });

    fetch(`${url}/budgetLines`, {
      method: "GET",
      headers: {
        Authorization: "Basic " + encode(`${apiUsername}:${apiPassword}`),
        token: token,
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((res) => {
        setBudgetLines(res);
      })
      .catch((err) => {
        messageApi.open({
          type: "error",
          content:
            "Something happened fetching budget lines! Please try again.",
        });
      });
    }
    
  }, []);

  useEffect(() => {
    setDataLoaded(false);
    let requestUrl = onlyMine
      ? `${url}/requests/byStatus/${searchStatus}/${user?._id}`
      : `${url}/requests/byStatus/${searchStatus}/${null}`;
    fetch(requestUrl, {
      method: "GET",
      headers: {
        Authorization: "Basic " + encode(`${apiUsername}:${apiPassword}`),
        token: token,
        "Content-Type": "application/json",
      },
    })
      .then((res) => getResultFromServer(res))
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
  }, [searchStatus, onlyMine]);

  useEffect(() => {
    if (searchText === "") {
      refresh();
      setDataset(dataset);
    } else {
      let _dataSet = [...dataset];
      let filtered = _dataSet.filter((d) => {
        return (
          d?.number.toString().indexOf(searchText) > -1 ||
          d?.title
            .toLowerCase()
            .indexOf(searchText.toLowerCase()) > -1 ||
          d?.createdBy?.firstName
            .toLowerCase()
            .indexOf(searchText.toLowerCase()) > -1 ||
          d?.createdBy?.lastName
            .toLowerCase()
            .indexOf(searchText.toLowerCase()) > -1
        );
      });
      setTempDataset(filtered);
      // else setTempDataset(dataset)
    }
  }, [searchText]);

  function refresh() {
    setDataLoaded(false);
    // setSearchStatus("mine");
    loadRequests()
      .then((res) => getResultFromServer(res))
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

  async function loadRequests() {
    // setDataLoaded(false);
    let requestUrl = onlyMine
      ? `${url}/requests/byStatus/${searchStatus}/${user?._id}`
      : `${url}/requests/byStatus/${searchStatus}/${null}`;
    // let requestUrl =
    //   searchStatus === "mine"
    //     ? `${url}/requests/${user?._id}`
    //     : `${url}/requests/byStatus/${searchStatus}`;

    return fetch(requestUrl, {
      method: "GET",
      headers: {
        Authorization: "Basic " + encode(`${apiUsername}:${apiPassword}`),
        token: token,
        "Content-Type": "application/json",
      },
    });
  }

  useEffect(() => {
    setUpdatingId("");
  }, [dataset]);

  const save = (_fileList) => {
    if (values && values[0]) {
      setConfirmLoading(true);
      let user = JSON.parse(localStorage.getItem("user"));
      let _values = [...values];
      _values.map((v, index) => {
        v.paths = _fileList[index];
        return v;
      });
      fetch(`${url}/requests/`, {
        method: "POST",
        headers: {
          Authorization: "Basic " + encode(`${apiUsername}:${apiPassword}`),
          token: token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dueDate,
          description,
          serviceCategory,
          items: _values,
          createdBy: user?._id,
          budgeted,
          budgetLine: budgetLine,
          title,
          level1Approver,
        }),
      })
        .then((res) => getResultFromServer(res))
        .then(async (res) => {
          setDueDate(null),
            setDescription(""),
            setServiceCategory(""),
            setValues([]),
            setBudgeted(true),
            setBudgetLine(""),
            setTitle(""),
            setFileList([]);
          setFiles([]);
          loadRequests()
            .then((res) => getResultFromServer(res))
            .then((res) => {
              setDataLoaded(true);
              setDataset(res);
              setTempDataset(res);
              setConfirmLoading(false);
              setOpen(false);
            })
            .catch((err) => {
              setConfirmLoading(false);
              setOpen(false);
              messageApi.open({
                type: "error",
                content: "Something happened! Please try again.",
              });
            });
        })
        .catch((err) => {
          setConfirmLoading(false);
          setOpen(false);
          messageApi.open({
            type: "error",
            content: "Something happened! Please try again.",
          });
        });
    } else {
      messageApi.error("Please add atleast one item!");
      setConfirmLoading(false);
    }
  };

  function approveRequest(id) {
    setUpdatingId(id);
    fetch(`${url}/requests/approve/${id}`, {
      method: "POST",
      headers: {
        Authorization: "Basic " + encode(`${apiUsername}:${apiPassword}`),
        token: token,
        "Content-Type": "application/json",
      },
    })
      .then((res) => getResultFromServer(res))
      .then((res) => {
        let _data = [...dataset];

        // Find item index using _.findIndex (thanks @AJ Richardson for comment)
        var index = _.findIndex(_data, { _id: id });
        let elindex = _data[index];
        elindex.status = "approved";
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

  function declineRequest(id, reason, declinedBy) {
    setUpdatingId(id);
    setConfirmRejectLoading(true);
    fetch(`${url}/requests/decline/${id}`, {
      method: "POST",
      body: JSON.stringify({
        reason,
        declinedBy,
      }),
      headers: {
        Authorization: "Basic " + encode(`${apiUsername}:${apiPassword}`),
        token: token,
        "Content-Type": "application/json",
      },
    })
      .then((res) => getResultFromServer(res))
      .then((res) => {
        let _data = [...dataset];

        // Find item index using _.findIndex (thanks @AJ Richardson for comment)
        var index = _.findIndex(_data, { _id: id });
        let elindex = _data[index];
        elindex.status = "declined";
        elindex.reasonForRejection = reason;
        elindex.declinedBy = declinedBy;
        // Replace item at index using native splice
        _data.splice(index, 1, elindex);

        setDataset(_data);
        setTempDataset(_data);
        setConfirmRejectLoading(false);
      })
      .catch((err) => {
        setConfirmRejectLoading(false);
        messageApi.open({
          type: "error",
          content: "Something happened! Please try again.",
        });
      });
  }

  function updateStatus(id, status) {
    setLoadingRowData(true);
    fetch(`${url}/requests/status/${id}`, {
      method: "PUT",
      headers: {
        Authorization: "Basic " + encode(`${apiUsername}:${apiPassword}`),
        token: token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status,
      }),
    })
      .then((res) => getResultFromServer(res))
      .then((res) => {
        loadRequests()
          .then((res) => res.json())
          .then((res) => {
            setDataset(res);
            setTempDataset(res);
            let r = res.filter((d) => {
              return d._id === rowData?._id;
            });
            setRowData(r[0]);
            setLoadingRowData(false);
            if (status === "withdrawn") setRowData(null);
          })
          .catch((err) => {
            setLoadingRowData(false);
            messageApi.open({
              type: "error",
              content: "Something happened! Please try again.",
            });
          });
      })
      .catch((err) => {
        setLoadingRowData(false);
        messageApi.open({
          type: "error",
          content: "Something happened! Please try again.",
        });
      });
  }

  function updateSourcingMethod(id, sourcingMethod) {
    fetch(`${url}/requests/sourcingMethod/${id}`, {
      method: "PUT",
      headers: {
        Authorization: "Basic " + encode(`${apiUsername}:${apiPassword}`),
        token: token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sourcingMethod,
      }),
    })
      .then((res) => res.json())
      .then((res) => {
        loadRequests()
          .then((res) => res.json())
          .then((res) => {
            setDataset(res);
            setTempDataset(res);
            let r = res.filter((d) => {
              return d._id === rowData?._id;
            });
            setRowData(r[0]);
          })
          .catch((err) => {
            messageApi.open({
              type: "error",
              content: "Something happened! Please try again.",
            });
          });
      })
      .catch((err) => {
        messageApi.open({
          type: "error",
          content: "Something happened! Please try again.",
        });
      });
  }

  function updateRequest() {
    setLoadingRowData(true);
    fetch(`${url}/requests/${rowData?._id}`, {
      method: "PUT",
      headers: {
        Authorization: "Basic " + encode(`${apiUsername}:${apiPassword}`),
        token: token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        updates: rowData,
      }),
    })
      .then((res) => getResultFromServer(res))
      .then((res) => {
        refresh();

        let r = dataset?.filter((d) => {
          return d._id === rowData?._id;
        });

        updateStatus(rowData?._id, "pending");
        setRowData(r[0]);
        setLoadingRowData(false);
        setDataLoaded(true);
      })
      .catch((err) => {
        setLoadingRowData(false);
        messageApi.open({
          type: "error",
          content: "Something happened! Please try again.",
        });
      });
  }

  function handleSetRow(row) {
    setLoadingRowData(true);
    setRowData(row);
    setLoadingRowData(false);
  }

  function createTender(tenderData) {
    setLoadingRowData(true);
    fetch(`${url}/tenders`, {
      method: "POST",
      headers: {
        Authorization: "Basic " + encode(`${apiUsername}:${apiPassword}`),
        token: token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(tenderData),
    })
      .then((res) => getResultFromServer(res))
      .then((res) => {
        updateStatus(rowData._id, "approved");
        updateSourcingMethod(rowData._id, sourcingMethod);
      })
      .catch((err) => {
        messageApi.open({
          type: "error",
          content: "Something happened! Please try again.",
        });
      });
  }

  function updateProgress(po, progress, qty, index) {
    let _po = { ...po };
    _po.items[index].deliveredQty = qty;
    _po.deliveryProgress = progress;
    fetch(`${url}/purchaseOrders/progress/${po?._id}`, {
      method: "PUT",
      body: JSON.stringify({
        updates: _po,
      }),
      headers: {
        Authorization: "Basic " + encode(`${apiUsername}:${apiPassword}`),
        token: token,
        "Content-Type": "application/json",
      },
    })
      .then((res) => getResultFromServer(res))
      .then((res) => {
        setReload(!reload);
        loadRequests()
          .then((res) => getResultFromServer(res))
          .then((res) => {
            setDataset(res);
            setTempDataset(res);
            let r = res.filter((d) => {
              return d._id === rowData?._id;
            });
            setRowData(r[0]);
            setLoadingRowData(false);
          })
          .catch((err) => {
            setLoadingRowData(false);
            // messageApi.open({
            //   type: "error",
            //   content: "Something happened! Please try again.",
            // });
          });
      });
  }

  function rateDelivery(po, rate, comment) {
    let _po = { ...po };
    _po.rate = rate;
    _po.rateComment = comment;
    setLoadingRowData(true);
    fetch(`${url}/purchaseOrders/progress/${po?._id}`, {
      method: "PUT",
      body: JSON.stringify({
        updates: _po,
      }),
      headers: {
        Authorization: "Basic " + encode(`${apiUsername}:${apiPassword}`),
        token: token,
        "Content-Type": "application/json",
      },
    })
      .then((res) => getResultFromServer(res))
      .then((res) => {
        setReload(!reload);
        loadRequests()
          .then((res) => getResultFromServer(res))
          .then((res) => {
            setDataset(res);
            setTempDataset(res);
            let r = res.filter((d) => {
              return d._id === rowData?._id;
            });

            setRowData(r[0]);
            setLoadingRowData(false);
          })
          .catch((err) => {
            setLoadingRowData(false);
            messageApi.open({
              type: "error",
              content: "Something happened! Please try again.",
            });
          });
      });
  }

  async function createPO(
    vendor,
    tender,
    createdBy,
    sections,
    items,
    B1Data,
    signatories,
    request,
    reqAttachmentDocId
  ) {

    console.log(B1Data)
    return true
    // return fetch(`${url}/purchaseOrders/`, {
    //   method: "POST",
    //   headers: {
    //     Authorization: "Basic " + encode(`${apiUsername}:${apiPassword}`),
    //     token: token,
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify({
    //     vendor,
    //     tender,
    //     createdBy,
    //     sections,
    //     items,
    //     B1Data,
    //     request: rowData?._id,
    //     signatories,
    //     request,
    //     reqAttachmentDocId,
    //   }),
    // })
    //   .then((res) => getResultFromServer(res))
    //   .then((res1) => {
    //     if (res1.error || res1.code) {
    //       messageApi.open({
    //         type: "error",
    //         content: res1.message?.value,
    //       });
    //     } else {
    //       updateStatus(rowData._id, "approved");
    //       updateSourcingMethod(rowData._id, sourcingMethod);
    //       messageApi.open({
    //         type: "success",
    //         content: "PO created!",
    //       });
    //     }
    //   })
    //   .catch((err) => {
    //     console.error(err);
    //     setLoadingRowData(false);
    //     messageApi.open({
    //       type: "error",
    //       content: JSON.stringify(err),
    //     });
    //   });
  }

  function createContract(
    vendor,
    tender,
    createdBy,
    sections,
    contractStartDate,
    contractEndDate,
    signatories,
    reqAttachmentDocId
  ) {
    fetch(`${url}/contracts/`, {
      method: "POST",
      headers: {
        Authorization: "Basic " + encode(`${apiUsername}:${apiPassword}`),
        token: token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        vendor,
        tender,
        createdBy,
        sections,
        contractStartDate,
        contractEndDate,
        signatories,
        reqAttachmentDocId,
        request: rowData?._id,
      }),
    })
      .then((res) => getResultFromServer(res))
      .then((res1) => {
        updateStatus(rowData._id, "approved");
        updateSourcingMethod(rowData._id, sourcingMethod);
        messageApi.open({
          type: "success",
          content: "Contract created!",
        });
      })
      .catch((err) => {
        messageApi.open({
          type: "error",
          content: JSON.stringify(err),
        });
      });
  }

  function _setFileList(list) {
    setFileList(list);
  }

  function _setFiles(newFileList) {
    setFiles(newFileList);
  }

  const handleUpload = (files) => {
    if (files?.length < 1) {
      messageApi.error("Please add at least one doc.");
      setConfirmLoading(false);
    } else {
      files.forEach((filesPerRow, rowIndex) => {
        filesPerRow.map((rowFile, fileIndex) => {
          const formData = new FormData();
          formData.append("files[]", rowFile);

          // You can use any AJAX library you like
          fetch(`${url}/uploads/termsOfReference/`, {
            method: "POST",
            body: formData,
            headers: {
              Authorization: "Basic " + encode(`${apiUsername}:${apiPassword}`),
              token: token,
              // "Content-Type": "multipart/form-data",
            },
          })
            .then((res) => getResultFromServer(res))
            .then((savedFiles) => {
              let _filenames = savedFiles?.map((f) => {
                return f?.filename;
              });

              let _files = [...files];
              _files[rowIndex][fileIndex] = _filenames[0];

              if (
                rowIndex === files?.length - 1 &&
                fileIndex === filesPerRow.length - 1
              ) {
                save(_files);
              }
            })
            .catch((err) => {
              messageApi.error("upload failed.");
            })
            .finally(() => {});
        });
      });
    }
  };

  const getMyPendingRequest = (value) => {
    setMyPendingRequest(value);

    if (value == true) {
      const newFilter = tempDataset.filter(
        (item) =>
          item?.level1Approver?._id == user._id ||
          (item?.status === "approved (hod)" &&
            user?.permissions?.canApproveAsHof) ||
          user?.permissions?.canApproveAsPM
      );

      const statusFilter = newFilter.filter(
        (item) =>
          (user?.permissions?.canApproveAsHod && item.status == "pending") ||
          (user?.permissions?.canApproveAsHof &&
            item.status == "approved (hod)") ||
          (user?.permissions?.canApproveAsPM && item.status == "approved (fd)")
      );

      setTempDataset(statusFilter);
    } else {
      refresh();
    }
  };

  function getResultFromServer(res) {
    if (res.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      router.push("/auth?goTo=/system/requests&sessionExpired=true");
    } else {
      return res.json();
    }
  }

  return !rowData ? (
    <>
      {contextHolder}
      {dataLoaded ? (
        <motion.div className="flex flex-col transition-opacity ease-in-out duration-1000 flex-1 space-y-10 h-full pb-10">
          <Row className="flex flex-col custom-sticky bg-white px-10 py-3 shadow space-y-2">
            <div className="flex flex-row items-center justify-between">
              <div className="text-xl font-semibold">Purchase Requests</div>

              {(currentUser?.permissions?.canApproveAsHod ||
                currentUser?.permissions?.canApproveAsHof ||
                currentUser?.permissions?.canApproveAsPM) && (
                <div className="flex items-center space-x-5">
                  <div className="flex flex-row items-center space-x-1">
                    <div>Awaiting my approval</div>
                    <Checkbox
                      checked={myPendingRequest}
                      disabled={onlyMine}
                      onChange={(e) => {
                        getMyPendingRequest(e.target.checked);
                      }}
                    />
                  </div>
                  <div className="flex flex-row items-center space-x-1">
                    <div>My requests</div>
                    <Checkbox
                      checked={onlyMine}
                      disabled={myPendingRequest}
                      onChange={(e) => {
                        setOnlyMine(e.target.checked);
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
            <Row className="flex flex-row justify-between items-center space-x-4">
              <div className="flex-1">
                <Select
                  // mode="tags"
                  style={{ width: "300px" }}
                  placeholder="Select status"
                  onChange={(value) => setSearchStatus(value)}
                  value={searchStatus}
                  options={[
                    // { value: "mine", label: "My requests" },
                    { value: "all", label: "All requests" },
                    { value: "pending", label: "Pending approval" },
                    {
                      value: "approved",
                      label: "Approved",
                    },
                    {
                      value: "declined",
                      label: "Declined",
                    },
                  ]}
                />
              </div>

              <Button
                type="text"
                icon={<ReloadOutlined />}
                onClick={() => refresh()}
              ></Button>
              <div>
                <Input.Search
                  style={{ width: "300px" }}
                  autoFocus
                  onChange={(e) => {
                    setSearchText(e?.target?.value);
                  }}
                  placeholder="Search by request#, initiator"
                />
              </div>

              {user?.permissions?.canCreateRequests && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    form.resetFields();

                    setOpen(true);
                  }}
                >
                  New request
                </Button>
              )}
            </Row>
          </Row>
          {/* <RequestStats totalRequests={dataset?.length}/> */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{
              opacity: dataLoaded ? 1 : 0,
            }}
            transition={{
              duration: 0.2,
              type: "tween",
              ease: "circOut",
            }}
            className="mx-10"
          >
            <UsersRequestsTable
              handleSetRow={handleSetRow}
              dataSet={tempDataset}
              handleApproveRequest={approveRequest}
              handleDeclineRequest={declineRequest}
              updatingId={updatingId}
            />
          </motion.div>

          <Modal
            title="Create a User Purchase request"
            centered
            open={open}
            onOk={async () => {
              await form.validateFields();
              if (values && values[0]) {
                let invalidValues = values?.filter(
                  (v) =>
                    v?.title == "" ||
                    v?.quantity == "" ||
                    v?.estimatedUnitCost === ""
                );
                if (invalidValues?.length == 0) {
                  setConfirmLoading(true);
                  handleUpload(files);
                }
              } else {
                messageApi.error("Please add atleast one item!");
              }
            }}
            onCancel={() => {
              setOpen(false);
              setValues([]);
            }}
            okText="Submit for approval"
            okButtonProps={{ size: "small", disabled: confirmLoading }}
            cancelButtonProps={{ size: "small" }}
            width={1200}
            confirmLoading={confirmLoading}
          >
            <Form
              // labelCol={{ span: 8 }}
              // wrapperCol={{ span: 16 }}
              // style={{ maxWidth: 600 }}
              className="mt-5"
              // layout="horizontal"
              form={form}
              onFinish={save}
            >
              <div className="grid md:grid-cols-3 gap-10">
                {/* Form grid 1 */}
                <div>
                  {/* Due date */}
                  <div>
                    <div>
                      <div>Due Date</div>
                    </div>
                    <div>
                      <Form.Item
                        name="dueDate"
                        rules={[
                          {
                            required: true,
                            message: "Due date is required",
                          },
                        ]}
                      >
                        <DatePicker
                          style={{ width: "100%" }}
                          defaultValue={null}
                          value={dueDate}
                          disabledDate={(current) =>
                            current.isBefore(moment().subtract(1, "d"))
                          }
                          onChange={(v, dstr) => setDueDate(dstr)}
                        />
                      </Form.Item>
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <div> Request title</div>
                    <div>
                      <Form.Item
                        name="title"
                        rules={[
                          {
                            required: true,
                            message: "Request title is required",
                          },
                        ]}
                      >
                        <Input
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="How would you name your request?"
                        />
                      </Form.Item>
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <div>Request Category</div>
                    <div>
                      <Form.Item
                        name="serviceCategory"
                        rules={[
                          {
                            required: true,
                            message: "Service category is required",
                          },
                        ]}
                      >
                        <Select
                          defaultValue={serviceCategory}
                          placeholder="Select service category"
                          showSearch
                          onChange={(value) => {
                            setServiceCategory(value);
                          }}
                          filterSort={(optionA, optionB) =>
                            (optionA?.label ?? "")
                              .toLowerCase()
                              .localeCompare(
                                (optionB?.label ?? "").toLowerCase()
                              )
                          }
                          filterOption={(inputValue, option) =>
                            option.label
                              .toLowerCase()
                              .includes(inputValue.toLowerCase())
                          }
                          // defaultValue="RWF"
                          // options={[...serviceCategories, {description: 'Others'}].map((s) => {
                            options={serviceCategories.map((s) => {
                            return {
                              value: s.description,
                              label: s.description,
                            };
                          })}
                        ></Select>
                      </Form.Item>
                    </div>
                  </div>
                </div>
                {/* Form grid 2 */}
                <div>
                  {/* Approver */}
                  <div>
                    <div>Level 1 Approver</div>
                    <div>
                      <Form.Item
                        name="level1Approver"
                        rules={[
                          {
                            required: true,
                            message: "Level 1 approver is required",
                          },
                        ]}
                      >
                        <Select
                          defaultValue={defaultApprover}
                          placeholder="Select Level1 Approver"
                          showSearch
                          onChange={(value) => {
                            setLevel1Approver(value);
                          }}
                          filterOption={(input, option) =>
                            (option?.label ?? "")
                              .toLowerCase()
                              .includes(input.toLowerCase())
                          }
                          options={level1Approvers.map((l) => {
                            return {
                              label: l?.firstName + " " + l?.lastName,
                              value: l?._id,
                            };
                          })}
                        ></Select>
                      </Form.Item>
                    </div>
                  </div>
                  {/* Description */}
                  <div>
                    <div>Request Description</div>
                    <div>
                      <Form.Item
                        name="description"
                        rules={[
                          {
                            required: true,
                            message: "Description is required",
                          },
                        ]}
                      >
                        <Input.TextArea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Briefly describe your request"
                          showCount
                          maxLength={100}
                        />
                      </Form.Item>
                    </div>
                  </div>
                </div>

                <div>
                  {/* Budgeted */}
                  <div>
                    <div>Budgeted?</div>
                    <div>
                      <Form.Item
                        name="budgeted"
                        valuePropName="checked"
                        // wrapperCol={{ offset: 8, span: 16 }}
                      >
                        <Radio.Group
                          onChange={(e) => {
                            setBudgeted(e.target.value);
                            if (e.target.value === false) setBudgetLine(null);
                          }}
                          value={budgeted}
                        >
                          <Radio value={true}>Yes</Radio>
                          <Radio value={false}>No</Radio>
                        </Radio.Group>
                      </Form.Item>
                    </div>
                  </div>

                  {/* Budget Lines */}
                  {budgeted && (
                    // <Form.Item label="Budget Line" name="budgetLine">
                    //   <Input
                    //     onChange={(e) => {
                    //       setBudgetLine(e.target.value);
                    //     }}
                    //     placeholder=""
                    //   />
                    // </Form.Item>

                    <div>
                      <div>Budget Line</div>
                      <div>
                        <Form.Item
                          name="budgetLine"
                          rules={[
                            {
                              required: budgeted,
                              message: "Budget Line is required",
                            },
                          ]}
                        >
                          <Select
                            // defaultValue={budgetLine}
                            placeholder="Select service category"
                            showSearch
                            onChange={(value, option) => {
                              setBudgetLine(value);
                            }}
                            // filterSort={(optionA, optionB) =>
                            //   (optionA?.label ?? "")
                            //     .toLowerCase()
                            //     .localeCompare(
                            //       (optionB?.label ?? "").toLowerCase()
                            //     )
                            // }
                            filterOption={(inputValue, option) => {
                              return option.label
                                .toLowerCase()
                                .includes(inputValue.toLowerCase());
                            }}
                            options={budgetLines.map((s) => {
                              return {
                                label: s.description.toUpperCase(),
                                options: s.budgetlines.map((sub) => {
                                  return {
                                    label: sub.description,
                                    value: sub._id,
                                    title: sub.description,
                                  };
                                }),
                              };
                            })}
                          ></Select>
                        </Form.Item>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Form>

            <div>
              <Typography.Title level={4}>Items</Typography.Title>
              {/* <ItemList handleSetValues={setValues} /> */}
              <ItemsTable
                setDataSource={setValues}
                dataSource={values}
                fileList={fileList}
                setFileList={_setFileList}
                files={files}
                setFiles={_setFiles}
              />
            </div>
          </Modal>

          {/* <div class="absolute -bottom-32 right-10 opacity-10">
            <Image src="/icons/blue icon.png" width={110} height={100} />
          </div> */}
        </motion.div>
      ) : (
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
      )}
    </>
  ) : (
    buildRequest(
      rowData,
      setRowData,
      updateStatus,
      loadingRowData,
      rowData,
      createTender,
      declineRequest,
      setConfirmRejectLoading,
      confirmRejectLoading,
      updateProgress,
      reload,
      createPO,
      createContract
    )
  );
  function buildRequest(
    selectedReqId,
    setSelectedReqId,
    updateStatus,
    loadingRowData,
    rowData,
    createTender,
    declineRequest,
    setConfirmRejectLoading,
    confirmRejectLoading,
    updateProgress,
    reload,
    createPO,
    createContract
  ) {
    return (
      <div className="flex flex-col mx-10 transition-opacity ease-in-out duration-1000 py-5 flex-1 space-y-3 h-full">
        {contextHolder}
        <div className="flex flex-row justify-between items-center">
          <div className="flex flex-row space-x-10 items-center">
            <div>
              <Button
                icon={<ArrowLeftOutlined />}
                type="primary"
                onClick={() => {
                  setSelectedReqId(null);
                  setEditRequest(false);
                }}
              >
                Back
              </Button>
            </div>

            {editRequest && (
              <div className="flex flex-row items-center text-xl font-semibold">
                <Typography.Text
                  level={5}
                  editable={
                    editRequest && {
                      text: selectedReqId?.title,
                      onChange: (e) => {
                        let req = { ...selectedReqId };
                        req.title = e;
                        setSelectedReqId(req);
                      },
                    }
                  }
                >
                  {selectedReqId?.title}
                </Typography.Text>
              </div>
            )}

            {editRequest && (
              <div>
                <Button
                  icon={<SaveOutlined />}
                  type="primary"
                  onClick={() => {
                    updateRequest();
                  }}
                >
                  Save
                </Button>
              </div>
            )}

            {!editRequest && (
              <div className="text-xl font-semibold">
                Request - {selectedReqId?.title}
              </div>
            )}
          </div>
          {(rowData?.level1Approver?._id === user?._id ||
            rowData?.createdBy?._id === user?._id) &&
            rowData?.status !== "approved" && (
              <Switch
                checkedChildren={<EditOutlined />}
                unCheckedChildren={<EyeOutlined />}
                onChange={(e) => setEditRequest(e)}
              />
            )}
        </div>
        <RequestDetails
          handleUpdateStatus={updateStatus}
          loading={loadingRowData}
          data={rowData}
          handleCreateTender={createTender}
          handleReject={declineRequest}
          setConfirmRejectLoading={setConfirmRejectLoading}
          confirmRejectLoading={confirmRejectLoading}
          handleUpdateProgress={updateProgress}
          reload={reload}
          handleCreatePO={createPO}
          handleCreateContract={createContract}
          edit={editRequest}
          handleUpdateRequest={setSelectedReqId}
          handleRateDelivery={rateDelivery}
          refDoc={sourcingMethod}
          setRefDoc={setSourcingMethod}
        />
      </div>
    );
  }
}
