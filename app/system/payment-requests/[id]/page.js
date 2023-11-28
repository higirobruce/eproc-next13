"use client";
import React, { useEffect, useState } from "react";
import { encode } from "base-64";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  message,
  Popconfirm,
  Radio,
  Select,
  Steps,
  Switch,
  Tag,
  Timeline,
  Typography,
} from "antd";
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CheckOutlined,
  CiCircleOutlined,
  CloseCircleOutlined,
  CloseOutlined,
  DislikeOutlined,
  EditOutlined,
  EyeOutlined,
  LoadingOutlined,
  PaperClipOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import moment from "moment";
import UploadOtherFiles from "@/app/components/uploadOtherFiles";
import {
  BanknotesIcon,
  ClipboardDocumentCheckIcon,
  CreditCardIcon,
  DocumentMagnifyingGlassIcon,
  LockClosedIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import UploadPaymentReq from "@/app/components/uploadPaymentReq";
import UpdatePaymentReqDoc from "@/app/components/updatePaymentReqDoc";
let url = process.env.NEXT_PUBLIC_BKEND_URL;
let apiUsername = process.env.NEXT_PUBLIC_API_USERNAME;
let apiPassword = process.env.NEXT_PUBLIC_API_PASSWORD;

async function getPaymentRequestDetails(id, router) {
  let token = localStorage.getItem("token");

  const res = await fetch(`${url}/paymentRequests/${id}`, {
    headers: {
      Authorization: "Basic " + `${encode(`${apiUsername}:${apiPassword}`)}`,
      token: token,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    // This will activate the closest `error.js` Error Boundary

    if (res.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      router.push(
        `/auth?goTo=/system/payment-requests/${id}&sessionExpired=true`
      );
    }
    return null;
    // throw new Error("Failed to fetch data");
  }

  return res.json();
}

async function getApprovers() {
  let token = localStorage.getItem("token");
  const res = await fetch(`${url}/users/level1Approvers`, {
    method: "GET",
    headers: {
      Authorization: "Basic " + encode(`${apiUsername}:${apiPassword}`),

      token: token,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    // This will activate the closest `error.js` Error Boundary

    return null;
    // throw new Error("Failed to fetch data");
  }

  return res.json();
}

async function getBudgetLines() {}

async function getFile(path) {
  let token = localStorage.getItem("token");
  const res = await fetch(path, {
    method: "GET",
    headers: {
      Authorization: "Basic " + encode(`${apiUsername}:${apiPassword}`),

      token: token,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    // This will activate the closest `error.js` Error Boundary

    return null;
    // throw new Error("Failed to fetch data");
  }

  return res.blob();
}

export default function PaymentRequest({ params }) {
  let user = JSON.parse(localStorage.getItem("user"));
  let token = localStorage.getItem("token");
  let [paymentRequest, setPaymentRequest] = useState(null);
  let router = useRouter();
  let [form] = Form.useForm();
  let [title, setTitle] = useState("");
  let [description, setDescription] = useState("");
  let [amount, setAmout] = useState(null);
  let [docId, setDocId] = useState(null);
  let [files, setFiles] = useState([]);
  let [filesProof, setFilesProof] = useState([]);
  let [showAddApproverForm, setShowAddApproverForm] = useState(false);
  let [level1Approvers, setLevel1Approvers] = useState([]);
  let [level1Approver, setLevel1Approver] = useState(null);
  let [currency, setCurrency] = useState("RWF");

  let [editRequest, setEditRequest] = useState(false);

  const [open, setOpen] = useState(false);
  const [openConfirmDeliv, setOpenConfirmDeliv] = useState([]);
  const [openApprove, setOpenApprove] = useState(false);
  const [openWithdraw, setOpenWithdraw] = useState(false);
  let [reason, setReason] = useState("");

  const [currentCode, setCurrentCode] = useState(-1);

  const [messageApi, contextHolder] = message.useMessage();
  const [confirmRejectLoading, setConfirmRejectLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  let [budgetLines, setBudgetLines] = useState([]);
  let [budgetLine, setBudgetLine] = useState(null);
  let [budgeted, setBudgeted] = useState(false);

  useEffect(() => {
    getPaymentRequestDetails(params.id, router).then((res) => {
      setPaymentRequest(res);
      let _files = [...files];

      let _paymentRequest = res;

      _paymentRequest?.docIds?.map(async (doc, i) => {
        let uid = `rc-upload-${moment().milliseconds()}-${i}`;
        let _url = `${url}/file/paymentRequests/${doc}`;
        let status = "done";
        let name = `Invoice ${i + 1}.pdf`;

        let response = await fetch(_url);
        let data = await response.blob();
        getBase64(data).then((res) => {
          let newFile = new File([data], name, {
            uid,
            url: _url,
            status,
            name,
            // type:'pdf'
          });

          console.log(newFile);
          _files.push(newFile);
          setFiles(_files);
        });
      });

      let statusCode = getRequestStatusCode(res?.status);
      setCurrentCode(statusCode);
      setBudgeted(res?.budgeted);
    });

    const getBase64 = (file) =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
      });

    getApprovers()
      .then((res) => {
        let approversList = res?.filter((a) => a?._id !== user?._id);
        setLevel1Approvers(res);
        let hod = approversList?.filter(
          (a) => a?.department?._id === user?.department
        );
      })
      .catch((err) => {
        messageApi.open({
          type: "error",
          content: "Something happened! Please try again.",
        });
      });
    fetch(`${url}/budgetLines`, {
      method: "GET",
      headers: {
        Authorization: "Basic " + window.btoa(`${apiUsername}:${apiPassword}`),
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
          content: "Connection Error!",
        });
      });
  }, [params]);

  useEffect(() => {
    console.log(files);
  }, [files]);

  function getPoTotalVal() {
    let t = 0;
    let tax = 0;
    paymentRequest?.items?.map((i) => {
      t = t + i?.quantity * i?.estimatedUnitCost;
      if (i.taxGroup === "I1")
        tax = tax + (i?.quantity * i?.estimatedUnitCost * 18) / 100;
    });
    return {
      totalVal: t,
      totalTax: tax,
      grossTotal: t + tax,
    };
  }

  const handleUpload = (action) => {
    if (files?.length < 1) {
      messageApi.error("Please add at least one doc.");
    } else {
      setSaving(true);

      let _files = [];
      if (action === "paymentProof") _files = [...filesProof];
      if (action === "update") _files = [...files];

      const formData = new FormData();
      _files.forEach((fileToSave, rowIndex) => {
        formData.append("files[]", fileToSave);
      });

      // You can use any AJAX library you like
      fetch(`${url}/uploads/paymentRequests/`, {
        method: "POST",
        body: formData,
        headers: {
          Authorization: "Basic " + encode(`${apiUsername}:${apiPassword}`),
          token: token,
          // "Content-Type": "multipart/form-data",
        },
      })
        .then((res) => res.json())
        .then((savedFiles) => {
          let _filenames = savedFiles?.map((f) => {
            return f?.filename;
          });

          action == "paymentProof" && sendProofForRequest(_filenames);
          action == "update" && updateRequest(_filenames);
        })
        .catch((err) => {
          console.log(err);
          messageApi.error("upload failed.");
        })
        .finally(() => {
          setSaving(false);
        });
    }
  };

  const save = (_fileList) => {
    fetch(`${url}/paymentRequests/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "",
        token: token,
      },
      body: JSON.stringify({
        title,
        description,
        amount,
        createdBy: user?._id,
        purchaseOrder: params?.poId,
        docIds: _fileList,
      }),
    })
      .then((res) => {
        if (res.ok) {
          return res.json();
        } else {
          throw res.statusText;
        }
      })
      .then((res) => {
        router.push("/system/payment-requests");
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const showPopconfirm = () => {
    setOpen(true);
  };

  const handleOk = () => {
    setConfirmRejectLoading(true);
    handleReject(data?._id, reason, `${user?.firstName} ${user?.lastName}`);
    setOpen(false);
    setConfirmRejectLoading(false);
  };

  const handleCancel = () => {
    setOpen(false);
  };

  function getRequestStatus(code) {
    // if (code === 0) return "verified";
    if (code === 0) return "pending-review";
    else if (code === 1) return "reviewed";
    else if (code === 2) return "approved (hod)";
    else if (code === 3) return "approved";
    else if (code === 4) return "paid";
    else if (code === 5) return "declined";
    else return "pending-review";
  }

  function getRequestStatusCode(status) {
    // if (status === "verified") return 0;
    if (status === "pending-review") return 0;
    else if (status === "reviewed") return 1;
    else if (status === "approved (hod)") return 2;
    else if (status === "approved") return 3;
    else if (status === "paid") return 4;
    else if (status === "declined") return 5;
    else return -1;
  }

  function changeStatus(statusCode) {
    setCurrentCode(statusCode);
    handleUpdateStatus(data?._id, getRequestStatus(statusCode));
  }

  function sendReview() {
    paymentRequest.approver = level1Approver;
    paymentRequest.reviewedBy = user?._id;
    paymentRequest.reviewedAt = moment();
    paymentRequest.status = "reviewed";
    paymentRequest.notifyApprover = true;
    fetch(`${url}/paymentRequests/${paymentRequest?._id}`, {
      method: "PUT",
      body: JSON.stringify({
        updates: paymentRequest,
      }),
      headers: {
        Authorization: "Basic " + encode(`${apiUsername}:${apiPassword}`),
        token: token,
        "Content-Type": "application/json",
      },
    })
      .then((res) => getResultFromServer(res))
      .then((res) => {
        refresh();
      });
  }

  function updateRequest(docIds) {
    // docIds[0] = null;
    if (
      !docIds.includes(null) &&
      !docIds.includes(undefined) &&
      !docIds.includes("")
    ) {
      paymentRequest.docIds = docIds;
    }
    if (paymentRequest.status == "declined") {
      paymentRequest.hod_approvalDate = null;
      paymentRequest.hof_approvalDate = null;
      paymentRequest.rejectionDate = null;
      paymentRequest.reasonForRejection = null;
      paymentRequest.approver = null;
      paymentRequest.reviewedAt = null;
      paymentRequest.reviewedBy = null;
    }
    paymentRequest.status =
      paymentRequest.status == "declined"
        ? "pending-review"
        : paymentRequest.status;

    fetch(`${url}/paymentRequests/${paymentRequest?._id}`, {
      method: "PUT",
      body: JSON.stringify({
        updates: paymentRequest,
      }),
      headers: {
        Authorization: "Basic " + encode(`${apiUsername}:${apiPassword}`),
        token: token,
        "Content-Type": "application/json",
      },
    })
      .then((res) => getResultFromServer(res))
      .then((res) => {
        refresh();
      });
  }

  function approveRequest(approvalStage) {
    if (getRequestStatusCode(approvalStage) == 2)
      paymentRequest.hod_approvalDate = moment();
    if (getRequestStatusCode(approvalStage) == 3)
      paymentRequest.hof_approvalDate = moment();

    paymentRequest.status = approvalStage;
    fetch(`${url}/paymentRequests/${paymentRequest?._id}`, {
      method: "PUT",
      body: JSON.stringify({
        updates: paymentRequest,
      }),
      headers: {
        Authorization: "Basic " + encode(`${apiUsername}:${apiPassword}`),
        token: token,
        "Content-Type": "application/json",
      },
    })
      .then((res) => getResultFromServer(res))
      .then((res) => {
        refresh();
      });
  }

  function declineRequest() {
    paymentRequest.status = "declined";
    paymentRequest.rejectionDate = moment();
    paymentRequest.reasonForRejection = reason;
    fetch(`${url}/paymentRequests/${paymentRequest?._id}`, {
      method: "PUT",
      body: JSON.stringify({
        updates: paymentRequest,
      }),
      headers: {
        Authorization: "Basic " + encode(`${apiUsername}:${apiPassword}`),
        token: token,
        "Content-Type": "application/json",
      },
    })
      .then((res) => getResultFromServer(res))
      .then((res) => {
        refresh();
      });
  }

  function sendProofForRequest(docIds) {
    paymentRequest.status = "paid";
    paymentRequest.paymentProofDocs = docIds;
    fetch(`${url}/paymentRequests/${paymentRequest?._id}`, {
      method: "PUT",
      body: JSON.stringify({
        updates: paymentRequest,
      }),
      headers: {
        Authorization: "Basic " + encode(`${apiUsername}:${apiPassword}`),
        token: token,
        "Content-Type": "application/json",
      },
    })
      .then((res) => getResultFromServer(res))
      .then((res) => {
        refresh();
      });
  }

  function refresh() {
    getPaymentRequestDetails(params.id).then((res) => {
      setPaymentRequest(res);
      let statusCode = getRequestStatusCode(res?.status);
      setCurrentCode(statusCode);
      setShowAddApproverForm(false);
      setLevel1Approver(null);
    });
  }

  function getResultFromServer(res) {
    if (res.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      router.push(
        `/auth?goTo=/system/payment-requests/${params?.id}/&sessionExpired=true`
      );
    } else {
      return res.json();
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{
        opacity: paymentRequest ? 1 : 0,
      }}
      transition={{
        duration: 0.2,
        type: "tween",
        ease: "circOut",
      }}
      className="flex flex-col mx-10 py-5 flex-1 space-y-3 h-full"
    >
      {contextHolder}
      <div className="flex flex-row justify-between items-center">
        <div className="flex flex-row justify-between items-center">
          <div className="flex flex-row space-x-10 items-center">
            <div>
              <Button
                icon={<ArrowLeftOutlined />}
                type="primary"
                onClick={() => {
                  router.back();
                }}
              >
                Back
              </Button>
            </div>

            <div className="text-lg font-semibold">
              Payment request {paymentRequest?.number}
            </div>
          </div>
        </div>
        {((paymentRequest?.createdBy?._id === user?._id &&
          (paymentRequest?.status == "pending-review" ||
            paymentRequest?.status == "declined" ||
            paymentRequest?.status.includes("pending-approval"))) ||
          ((paymentRequest?.approver?._id === user?._id ||
            user?.permissions?.canApproveAsHof) &&
            (paymentRequest?.status.includes("pending-review") ||
              paymentRequest?.status.includes("pending-approval")))) && (
          <Switch
            checked={editRequest}
            checkedChildren={<EditOutlined />}
            unCheckedChildren={<EyeOutlined />}
            onChange={(e) => setEditRequest(e)}
          />
        )}
      </div>

      <div className="grid md:grid-cols-5 gap-1 ">
        <div className="md:col-span-4 flex flex-col ring-1 ring-gray-200 p-5 rounded shadow-md bg-white overflow-y-scroll space-y-5">
          {/* Overview */}
          <div>
            <Typography.Title level={4}>Overview</Typography.Title>
          </div>
          <div>
            <Tag
              className="shadow"
              color={
                paymentRequest?.status == "pending-review"
                  ? "yellow"
                  : paymentRequest?.status.includes("approved (")
                  ? "orange"
                  : paymentRequest?.status == "approved" ||
                    paymentRequest?.status == "paid"
                  ? "green"
                  : paymentRequest?.status == "reviewed"
                  ? "yellow"
                  : "red"
              }
            >
              {paymentRequest?.status}
            </Tag>
          </div>
          <Form form={form}>
            <div className="grid md:grid-cols-4 sm:grid-cols-1 gap-6">
              {/* Request Title */}
              <div className="flex flex-col space-y-2">
                <div className="text-xs text-gray-400">Title</div>
                {!editRequest && (
                  <div className="text-xs">{paymentRequest?.title}</div>
                )}
                {editRequest && (
                  <div className="mr-10">
                    <Form.Item
                      name="title"
                      rules={[
                        {
                          required: true,
                          message: "Title is required",
                        },
                      ]}
                      initialValue={paymentRequest?.title}
                    >
                      <Input
                        // size="small"

                        className="text-xs"
                        // placeholder={paymentRequest?.title}
                        // defaultValue={paymentRequest?.title}
                        value={paymentRequest?.title}
                        onChange={(e) => {
                          let _p = { ...paymentRequest };
                          _p.title = e.target.value;
                          setPaymentRequest(_p);
                        }}
                      />
                    </Form.Item>
                  </div>
                )}
              </div>

              {/* Request Comment/addtional note */}
              <div className="flex flex-col  space-y-2 ">
                <div className="text-xs text-gray-400">Comment</div>
                {!editRequest && (
                  <div className="text-xs">{paymentRequest?.description}</div>
                )}
                {editRequest && (
                  <div className="mr-10">
                    <Form.Item
                      name="description"
                      rules={[
                        {
                          required: true,
                          message: "Description is required",
                        },
                      ]}
                      initialValue={paymentRequest?.description}
                    >
                      <Input.TextArea
                        size="small"
                        className="text-xs"
                        placeholder={paymentRequest?.description}
                        // defaultValue={paymentRequest?.description}
                        value={paymentRequest?.description}
                        onChange={(e) => {
                          paymentRequest.description = e.target.value;
                        }}
                      />
                    </Form.Item>
                  </div>
                )}
              </div>

              {/* Request Amount due*/}
              <div className="flex flex-col  space-y-2 ">
                <div className="text-xs text-gray-400">Amount due</div>
                {!editRequest && (
                  <div className="text-xs">
                    {paymentRequest?.amount?.toLocaleString()}{" "}
                    {paymentRequest?.currency}
                  </div>
                )}
                {editRequest && (
                  <div className="mr-10">
                    {/* <InputNumber
                    size="small"
                    name="title"
                    className="text-xs w-full"
                    placeholder={paymentRequest?.amount}
                    onChange={(e) => {
                      paymentRequest.amount = e;
                    }}
                  /> */}

                    <Form.Item>
                      <Form.Item
                        name="amount"
                        noStyle
                        rules={[
                          {
                            required: true,
                            message: "Amount is required",
                          },
                        ]}
                        initialValue={paymentRequest.amount}
                      >
                        <InputNumber
                          style={{ width: "100%" }}
                          addonBefore={
                            <Form.Item noStyle name="currency">
                              <Select
                                onChange={(value) =>
                                  (paymentRequest.currency = value)
                                }
                                defaultValue={paymentRequest.currency}
                                value={paymentRequest.currency}
                                options={[
                                  {
                                    value: "RWF",
                                    label: "RWF",
                                    key: "RWF",
                                  },
                                  {
                                    value: "USD",
                                    label: "USD",
                                    key: "USD",
                                  },
                                  {
                                    value: "EUR",
                                    label: "EUR",
                                    key: "EUR",
                                  },
                                ]}
                              ></Select>
                            </Form.Item>
                          }
                          // defaultValue={paymentRequest.amount}
                          value={paymentRequest.amount}
                          onChange={(e) => {
                            paymentRequest.amount = e;
                          }}
                        />
                      </Form.Item>
                    </Form.Item>
                  </div>
                )}
              </div>

              {/* Request Attached Invoice*/}
              <div className="flex flex-col  space-y-2 ">
                <div className="text-xs text-gray-400">Attached Invoice(s)</div>
                {!editRequest && (
                  <div className="grid grid-cols-2 gap-y-2">
                    {paymentRequest?.docIds?.map((doc, i) => {
                      return (
                        <>
                          <Link
                            href={`${url}/file/paymentRequests/${doc}`}
                            target="_blank"
                          >
                            <div className="text-xs">
                              <div className="flex flex-row space-x-1 items-center">
                                {" "}
                                <PaperClipOutlined /> Invoice {i + 1}
                              </div>
                            </div>
                          </Link>
                          {((user?.permissions?.canApproveAsHod &&
                            user?._id === paymentRequest?.approver?._id) ||
                            paymentRequest.status == "pending-review" ||
                            user?.permissions?.canApproveAsHof) && (
                            <UpdatePaymentReqDoc
                              iconOnly={true}
                              uuid={doc?.split(".")[0]}
                              label="update"
                            />
                          )}
                        </>
                      );
                    })}
                  </div>
                )}

                {editRequest && (
                  <UploadOtherFiles files={files} setFiles={setFiles} />
                )}
              </div>

              {/* Budgeted */}
              <div className="flex flex-col space-y-1 items-start">
                <div className="text-xs text-gray-400">Budgeted:</div>
                {!editRequest && (
                  <div className="text-sm font-semibold text-gray-600">
                    {paymentRequest?.budgeted ? "Yes" : "No"}
                  </div>
                )}
                {editRequest && (
                  <div className="text-xs text-gray-400">
                    <Form.Item name="budgeted">
                      <Select
                        // mode="multiple"
                        // allowClear
                        defaultValue={paymentRequest?.budgeted ? "Yes" : "No"}
                        value={paymentRequest?.budgeted ? "Yes" : "No"}
                        // style={{ width: "100%" }}
                        placeholder="Please select"
                        disabled={paymentRequest?.category === "external"}
                        onChange={(value) => {
                          paymentRequest.budgeted = value;
                          if (value === false) paymentRequest.budgetLine = null;
                          setBudgeted(value);
                          // handleUpdateRequest(r);
                        }}
                        options={[
                          { value: true, label: "Yes" },
                          { value: false, label: "No" },
                        ]}
                      />
                    </Form.Item>
                  </div>
                )}
              </div>

              {/* Budget Line */}
              <div className="flex flex-col space-y-1 items-start">
                <div className="text-xs text-gray-400">Budget Line:</div>
                {!editRequest && (
                  <div className="text-sm font-semibold text-gray-600">
                    {paymentRequest?.budgetLine?.description}
                  </div>
                )}

                {editRequest && budgeted && (
                  // <Select
                  //   // mode="multiple"
                  //   // allowClear
                  //   className="ml-3"
                  //   defaultValue={data?.budgetLine}
                  //   style={{ width: "100%" }}
                  //   placeholder="Please select"
                  //   onChange={(value) => {
                  //     let r = { ...data };
                  //     r.budgetLine = value;
                  //     handleUpdateRequest(r);
                  //   }}
                  // >
                  //   {servCategories?.map((s) => {
                  //     return (
                  //       <Select.Option
                  //         key={s._id}
                  //         value={s.description}
                  //       >
                  //         {s.description}
                  //       </Select.Option>
                  //     );
                  //   })}
                  // </Select>

                  <Form.Item
                    name="budgetLine"
                    rules={[
                      {
                        required: true,
                        message: "Budget Line is required",
                      },
                    ]}
                    initialValue={paymentRequest?.budgetLine?._id}
                  >
                    <Select
                      // defaultValue={budgetLine}

                      // className="ml-3"
                      placeholder="Select service category"
                      showSearch
                      // defaultValue={paymentRequest?.budgetLine?._id}
                      value={paymentRequest?.budgetLine?._id}
                      onChange={(value, option) => {
                        paymentRequest.budgetLine = value;
                      }}
                      disabled={paymentRequest?.category === "external"}
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
                )}
              </div>

              {editRequest && (
                <div>
                  <Button
                    loading={saving}
                    icon={<SaveOutlined />}
                    type="primary"
                    onClick={async () => {
                      await form.validateFields();
                      if (files.length < 1) {
                        messageApi.error("Please attach atleast one file!");
                      } else {
                        setEditRequest(false);
                        handleUpload("update");
                      }
                    }}
                  >
                    Update
                  </Button>
                </div>
              )}
            </div>
          </Form>

          {/* Approval flow */}
          <div>
            <Typography.Title level={4}>Request Approval</Typography.Title>
          </div>

          {paymentRequest?.status === "pending-review" &&
            !user?.permissions?.canEditPaymentRequests && (
              <div className="text-sm text-gray-600 p-3 bg-gray-50 rounded-md flex flex-col justify-center items-center">
                <LockClosedIcon className="h-10 w-10 text-blue-400" />
                <p>
                  This request needs to be reviewed for the payment approval
                  process to start.
                </p>
              </div>
            )}

          {paymentRequest?.approver && (
            <div className="mx-3 mt-5 ">
              <Steps
                direction="vertical"
                current={currentCode}
                items={[
                  {
                    title: `Reviewed by ${paymentRequest?.reviewedBy?.firstName} ${paymentRequest?.reviewedBy?.lastName}`,
                    icon: <DocumentMagnifyingGlassIcon className="h-5" />,
                    subTitle: currentCode > 0 && (
                      <div className="flex flex-row items-center space-x-1 text-xs font-semibold">
                        <div>
                          {currentCode > 0 && paymentRequest?.reviewedAt && (
                            <CheckOutlined className="h-5 w-5 text-green-500" />
                          )}
                        </div>
                        <div>
                          {currentCode > 0 &&
                            paymentRequest?.reviewedAt &&
                            `Reviewed ` +
                              moment(paymentRequest?.reviewedAt).fromNow()}
                        </div>
                      </div>
                    ),

                    disabled:
                      !user?.permissions?.canApproveAsHod || currentCode > 0,
                  },
                  {
                    title: `Level 1 (${
                      paymentRequest?.approver?.firstName +
                      " " +
                      paymentRequest?.approver?.lastName
                    })`,
                    icon: <ClipboardDocumentCheckIcon className="h-5" />,
                    subTitle: currentCode > 1 && (
                      <div className="flex flex-row items-center space-x-1 text-xs font-semibold">
                        <div>
                          {currentCode === 5 &&
                            !paymentRequest?.hod_approvalDate && (
                              <CloseOutlined className="h-5 w-5 text-red-500" />
                            )}
                          {currentCode > 1 &&
                            paymentRequest?.hod_approvalDate && (
                              <CheckOutlined className="h-5 w-5 text-green-500" />
                            )}
                        </div>
                        <div>
                          {currentCode === 5 &&
                            !paymentRequest?.hod_approvalDate &&
                            `Declined ` +
                              moment(paymentRequest?.rejectionDate).fromNow()}
                          {currentCode > 1 &&
                            paymentRequest?.hod_approvalDate &&
                            `Approved ` +
                              moment(
                                paymentRequest?.hod_approvalDate
                              ).fromNow()}
                        </div>
                      </div>
                    ),
                    description: currentCode == 1 && (
                      <div className="flex flex-col">
                        <div>
                          Kindly check if the request is relevant and take
                          action accordingly.
                        </div>
                        <div className="flex flex-row space-x-5">
                          <div>
                            <Popconfirm
                              title="Are you sure?"
                              open={openApprove}
                              icon={
                                <QuestionCircleOutlined
                                  style={{ color: "red" }}
                                />
                              }
                              onConfirm={() => {
                                // changeStatus(2);
                                approveRequest(getRequestStatus(2));
                                setOpenApprove(false);
                              }}
                              // okButtonProps={{
                              //   loading: confirmRejectLoading,
                              // }}
                              onCancel={() => setOpenApprove(false)}
                            >
                              <Button
                                disabled={
                                  !user?.permissions?.canApproveAsHod ||
                                  user?._id !== paymentRequest?.approver?._id ||
                                  currentCode > 1
                                }
                                onClick={() => setOpenApprove(true)}
                                type="primary"
                                size="small"
                              >
                                Approve
                              </Button>
                            </Popconfirm>
                          </div>
                          <div>
                            <Popconfirm
                              title="Are you sure?"
                              open={open}
                              icon={
                                <QuestionCircleOutlined
                                  style={{ color: "red" }}
                                />
                              }
                              onConfirm={() => {
                                if (reason?.length >= 3) declineRequest();
                              }}
                              description={
                                <>
                                  <Input
                                    onChange={(v) => setReason(v.target.value)}
                                    placeholder="Please insert a reason for the rejection"
                                  ></Input>
                                </>
                              }
                              okButtonProps={{
                                disabled: reason?.length < 3,
                                loading: confirmRejectLoading,
                              }}
                              onCancel={handleCancel}
                            >
                              <Button
                                icon={<DislikeOutlined />}
                                disabled={
                                  !user?.permissions?.canApproveAsHod ||
                                  user?._id !== paymentRequest?.approver?._id ||
                                  currentCode > 1
                                }
                                danger
                                size="small"
                                type="primary"
                                onClick={showPopconfirm}
                              >
                                Reject
                              </Button>
                            </Popconfirm>
                          </div>
                        </div>
                      </div>
                    ),
                    disabled:
                      !user?.permissions?.canApproveAsHod || currentCode > 1,
                  },
                  {
                    title: "Level 2 (Finance)",
                    icon: <CreditCardIcon className="h-5" />,
                    subTitle: currentCode > 2 &&
                      paymentRequest?.hod_approvalDate && (
                        <div className="flex flex-row items-center space-x-1 text-xs font-semibold">
                          <div>
                            {currentCode === 5 &&
                              !paymentRequest?.hof_approvalDate && (
                                <CloseOutlined className="h-5 w-5 text-red-500" />
                              )}
                            {currentCode > 2 &&
                              paymentRequest?.hof_approvalDate && (
                                <CheckOutlined className="h-5 w-5 text-green-500" />
                              )}
                          </div>
                          <div>
                            {currentCode === 5 &&
                              !paymentRequest?.hof_approvalDate &&
                              `Declined ` +
                                moment(paymentRequest?.rejectionDate).fromNow()}
                            {currentCode > 2 &&
                              paymentRequest?.hof_approvalDate &&
                              `Approved ` +
                                moment(
                                  paymentRequest?.hof_approvalDate
                                ).fromNow()}
                          </div>
                        </div>
                      ),
                    description: currentCode === 2 && (
                      <div className="flex flex-col">
                        <div>
                          Kindly check if the request is relevant and take
                          action accordingly.
                        </div>
                        <div className="flex flex-row space-x-5">
                          <div>
                            <Popconfirm
                              title="Are you sure?"
                              open={openApprove}
                              icon={
                                <QuestionCircleOutlined
                                  style={{ color: "red" }}
                                />
                              }
                              onConfirm={() => {
                                approveRequest("approved");
                                setOpenApprove(false);
                              }}
                              // okButtonProps={{
                              //   loading: confirmRejectLoading,
                              // }}
                              onCancel={() => setOpenApprove(false)}
                            >
                              <Button
                                disabled={
                                  !user?.permissions?.canApproveAsHof ||
                                  currentCode > 2 ||
                                  currentCode < 0
                                }
                                onClick={() => setOpenApprove(true)}
                                type="primary"
                                size="small"
                              >
                                Approve
                              </Button>
                            </Popconfirm>
                          </div>
                          <div>
                            <Popconfirm
                              title="Are you sure?"
                              open={open}
                              icon={
                                <QuestionCircleOutlined
                                  style={{ color: "red" }}
                                />
                              }
                              onConfirm={() => {
                                if (reason?.length >= 3) declineRequest();
                              }}
                              okButtonProps={{
                                disabled: reason?.length < 3,
                                loading: confirmRejectLoading,
                              }}
                              onCancel={handleCancel}
                              description={
                                <>
                                  <Input
                                    onChange={(v) => setReason(v.target.value)}
                                    placeholder="Reason for rejection"
                                  ></Input>
                                </>
                              }
                            >
                              <Button
                                disabled={
                                  !user?.permissions?.canApproveAsHof ||
                                  currentCode > 2 ||
                                  currentCode < 0
                                }
                                type="primary"
                                danger
                                size="small"
                                onClick={showPopconfirm}
                              >
                                Reject
                              </Button>
                            </Popconfirm>
                          </div>
                        </div>
                      </div>
                    ),
                    disabled:
                      !user?.permissions?.canApproveAsHof ||
                      currentCode > 2 ||
                      currentCode < 0,
                  },
                ]}
              />
              {paymentRequest?.reasonForRejection && (
                <div className="bg-red-50 p-2 rounded-md">
                  {paymentRequest?.reasonForRejection}
                </div>
              )}
            </div>
          )}

          {!paymentRequest?.approver &&
            user?.userType !== "VENDOR" &&
            user?.permissions?.canEditPaymentRequests && (
              <div className="flex flex-col space-y-2">
                {/* <div className="text-xs text-gray-500">
                  {showAddApproverForm ? "" : "No approver selected yet"}
                </div> */}
                {!showAddApproverForm &&
                  user?.permissions?.canEditPaymentRequests && (
                    <div className="flex flex-row items-center space-x-1">
                      <Button
                        type="primary"
                        onClick={() => {
                          setShowAddApproverForm(!showAddApproverForm);
                          setLevel1Approver(null);
                        }}
                      >
                        Add approver
                      </Button>
                    </div>
                  )}
                {showAddApproverForm && (
                  <div className="flex flex-row items-center space-x-1">
                    <div
                      onClick={() => {
                        setShowAddApproverForm(!showAddApproverForm);
                        setLevel1Approver(null);
                      }}
                    >
                      <CloseCircleOutlined className="text-red-500" />
                    </div>
                  </div>
                )}
              </div>
            )}

          {showAddApproverForm && (
            <div className="w-1/3">
              <Form layout="vertical">
                <Form.Item
                  label="Select level 1 approver"
                  name="level1Approver"
                  rules={[
                    {
                      required: true,
                      message: "Level 1 approver is required",
                    },
                  ]}
                >
                  <Select
                    // defaultValue={defaultApprover}
                    placeholder="Select Approver"
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

                <Form.Item>
                  <Button
                    onClick={sendReview}
                    type="primary"
                    disabled={!level1Approver}
                  >
                    Submit
                  </Button>
                </Form.Item>
              </Form>
            </div>
          )}

          {/* Payment process */}
          <div className="flex flex-row justify-between items-center">
            <Typography.Title level={4}>Payment process</Typography.Title>
            <div>
              {paymentRequest?.status == "approved" && (
                <Tag color="orange">payment is due</Tag>
              )}
            </div>
          </div>

          {paymentRequest?.status === "approved" && (
            <>
              <UploadOtherFiles
                files={filesProof}
                setFiles={setFilesProof}
                label="Select Payment proof"
              />

              <div>
                <Button
                  loading={saving}
                  onClick={() => handleUpload("paymentProof")}
                  type="primary"
                  disabled={!filesProof || filesProof.length == 0}
                >
                  Submit
                </Button>
              </div>
            </>
          )}
          {paymentRequest?.status !== "approved" &&
            paymentRequest?.status !== "paid" && (
              <div className="text-sm text-gray-600 p-3 bg-gray-50 rounded-md flex flex-col justify-center items-center">
                <LockClosedIcon className="h-10 w-10 text-blue-400" />
                <p>
                  This request needs to be approved for the payment process to
                  start.
                </p>
              </div>
            )}

          {paymentRequest?.status === "paid" && (
            <div className="flex flex-col  space-y-2 ">
              <div className="text-xs text-gray-400">
                Attached Payment proof(s)
              </div>
              <div className="grid grid-cols-2 gap-y-2">
                {paymentRequest?.paymentProofDocs?.map((doc, i) => {
                  return (
                    <div className="flex flex-row items-center space-x-5">
                      <Link
                        href={`${url}/file/paymentRequests/${doc}`}
                        target="_blank"
                      >
                        <div className="text-xs">
                          <div className="flex flex-row space-x-1">
                            {" "}
                            <PaperClipOutlined /> Payment proof {i + 1}
                          </div>
                        </div>
                      </Link>
                      {user?.permissions?.canApproveAsHof && (
                        <UpdatePaymentReqDoc
                          iconOnly={true}
                          uuid={doc?.split(".")[0]}
                          label="update"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col rounded space-y-5 bg-white px-4 pt-2 shadow ">
          <Typography.Title level={5}>Workflow tracker</Typography.Title>
          <Timeline
            items={[
              {
                children: <div className="text-xs text-gray-500">Review</div>,
                color: paymentRequest?.status !== "declined" ? "blue" : "red",
                dot:
                  paymentRequest?.status == "reviewed" ||
                  paymentRequest?.status.includes("approved") ||
                  paymentRequest?.status == "paid" ? (
                    <CheckCircleOutlined className=" text-green-500" />
                  ) : paymentRequest?.status == "declined" ? (
                    <CloseCircleOutlined className=" text-red-500" />
                  ) : (
                    <LoadingOutlined className=" text-blue-500" />
                  ),
              },
              {
                children: <div className="text-xs text-gray-500">Approval</div>,
                color:
                  paymentRequest?.status == "approved" ||
                  paymentRequest?.status == "paid"
                    ? "blue"
                    : "gray",
                dot:
                  ((paymentRequest?.status == "approved" ||
                    paymentRequest?.status == "paid") && (
                    <CheckCircleOutlined className=" text-green-500" />
                  )) ||
                  ((paymentRequest?.status == "reviewed" ||
                    paymentRequest?.status.includes("approved (")) && (
                    <LoadingOutlined className=" text-blue-500" />
                  )),
              },
              {
                children: <div className="text-xs text-gray-500">Payment</div>,
                color: paymentRequest?.status == "paid" ? "blue" : "gray",
                dot:
                  (paymentRequest?.status == "paid" && (
                    <CheckCircleOutlined className=" text-green-500" />
                  )) ||
                  (paymentRequest?.status == "approved" && (
                    <LoadingOutlined className=" text-blue-500" />
                  )),
              },
            ]}
          />
        </div>
      </div>
    </motion.div>
  );
}
