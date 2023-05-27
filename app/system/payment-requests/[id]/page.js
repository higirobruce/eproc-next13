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
let url = process.env.NEXT_PUBLIC_BKEND_URL;
let apiUsername = process.env.NEXT_PUBLIC_API_USERNAME;
let apiPassword = process.env.NEXT_PUBLIC_API_PASSWORD;

async function getPaymentRequestDetails(id) {
  const res = await fetch(`${url}/paymentRequests/${id}`, {
    headers: {
      Authorization: "Basic " + `${encode(`${apiUsername}:${apiPassword}`)}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    // This will activate the closest `error.js` Error Boundary
    console.log(id);
    return null;
    // throw new Error("Failed to fetch data");
  }

  return res.json();
}

async function getApprovers() {
  const res = await fetch(`${url}/users/level1Approvers`, {
    method: "GET",
    headers: {
      Authorization: "Basic " + encode(`${apiUsername}:${apiPassword}`),
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

export default function PaymentRequest({ params }) {
  let user = JSON.parse(localStorage.getItem("user"));
  let [paymentRequest, setPaymentRequest] = useState(null);
  let router = useRouter();
  let [form] = Form.useForm();
  let [title, setTitle] = useState("");
  let [description, setDescription] = useState("");
  let [amount, setAmout] = useState(null);
  let [docId, setDocId] = useState(null);
  let [files, setFiles] = useState([]);
  let [showAddApproverForm, setShowAddApproverForm] = useState(false);
  let [level1Approvers, setLevel1Approvers] = useState([]);
  let [level1Approver, setLevel1Approver] = useState(null);

  const [open, setOpen] = useState(false);
  const [openConfirmDeliv, setOpenConfirmDeliv] = useState([]);
  const [openApprove, setOpenApprove] = useState(false);
  const [openWithdraw, setOpenWithdraw] = useState(false);
  let [reason, setReason] = useState("");

  const [currentCode, setCurrentCode] = useState(-1);

  const [messageApi, contextHolder] = message.useMessage();
  const [confirmRejectLoading, setConfirmRejectLoading] = useState(false);

  useEffect(() => {
    getPaymentRequestDetails(params.id).then((res) => {
      setPaymentRequest(res);
      let statusCode = getRequestStatusCode(res?.status);
      setCurrentCode(statusCode);
    });

    getApprovers()
      .then((res) => {
        let approversList = res?.filter((a) => a?._id !== user?._id);
        console.log(res);
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

  const handleUpload = () => {
    if (files?.length < 1) {
      messageApi.error("Please add at least one doc.");
    } else {
      let docIds = [];
      files.forEach((fileToSave, rowIndex) => {
        const formData = new FormData();
        formData.append("files[]", fileToSave);

        // You can use any AJAX library you like
        fetch(`${url}/uploads/paymentRequests/`, {
          method: "POST",
          body: formData,
          headers: {
            Authorization: "Basic " + encode(`${apiUsername}:${apiPassword}`),
            // "Content-Type": "multipart/form-data",
          },
        })
          .then((res) => res.json())
          .then((savedFiles) => {
            let _filenames = savedFiles?.map((f) => {
              return f?.filename;
            });

            docIds.push(_filenames[0]);

            if (rowIndex === files.length - 1) {
              sendProofForRequest(docIds);
            }
          })
          .catch((err) => {
            console.log(err);
            messageApi.error("upload failed.");
          })
          .finally(() => {});
      });
    }
  };

  const save = (_fileList) => {
    fetch(`${url}/paymentRequests/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "" },
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
    else if (code === 3) return "approved (hof)";
    else if (code === 4) return "declined";
    else return "pending-review";
  }

  function getRequestStatusCode(status) {
    // if (status === "verified") return 0;
    if (status === "pending-review") return 0;
    else if (status === "reviewed") return 1;
    else if (status === "approved (hod)") return 2;
    else if (status === "approved") return 3;
    else if (status === "declined") return 4;
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
    fetch(`${url}/paymentRequests/${paymentRequest?._id}`, {
      method: "PUT",
      body: JSON.stringify({
        updates: paymentRequest,
      }),
      headers: {
        Authorization: "Basic " + encode(`${apiUsername}:${apiPassword}`),
        "Content-Type": "application/json",
      },
    })
      .then((res) => {
        if (res.ok) {
          return res.json();
        }
      })
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
        "Content-Type": "application/json",
      },
    })
      .then((res) => {
        if (res.ok) {
          return res.json();
        }
      })
      .then((res) => {
        refresh();
      });
  }

  function declineRequest() {
    paymentRequest.status = 'declined';
    paymentRequest.rejectionDate = moment();
    paymentRequest.reasonForRejection = reason
    fetch(`${url}/paymentRequests/${paymentRequest?._id}`, {
      method: "PUT",
      body: JSON.stringify({
        updates: paymentRequest,
      }),
      headers: {
        Authorization: "Basic " + encode(`${apiUsername}:${apiPassword}`),
        "Content-Type": "application/json",
      },
    })
      .then((res) => {
        if (res.ok) {
          return res.json();
        }
      })
      .then((res) => {
        refresh();
      });
  }

  function sendProofForRequest(docIds) {
   
    paymentRequest.status = 'paid';
    paymentRequest.paymentProofDocs = docIds
    fetch(`${url}/paymentRequests/${paymentRequest?._id}`, {
      method: "PUT",
      body: JSON.stringify({
        updates: paymentRequest,
      }),
      headers: {
        Authorization: "Basic " + encode(`${apiUsername}:${apiPassword}`),
        "Content-Type": "application/json",
      },
    })
      .then((res) => {
        if (res.ok) {
          return res.json();
        }
      })
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
    });
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

      <div className="grid md:grid-cols-5 gap-1">
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
                  : paymentRequest?.status == "approved" || paymentRequest?.status == "paid"
                  ? "green"
                  : paymentRequest?.status == "reviewed" ? 'yellow' : 'red'
              }
            >
              {paymentRequest?.status}
            </Tag>
          </div>
          <div className="grid md:grid-cols-4 sm:grid-cols-1">
            {/* Request Title */}
            <div className="flex flex-col space-y-2">
              <div className="text-xs text-gray-400">Title</div>
              <div className="text-xs">{paymentRequest?.title}</div>
            </div>

            {/* Request Comment/addtional note */}
            <div className="flex flex-col  space-y-2 ">
              <div className="text-xs text-gray-400">Comment</div>
              <div className="text-xs">{paymentRequest?.description}</div>
            </div>

            {/* Request Amount due*/}
            <div className="flex flex-col  space-y-2 ">
              <div className="text-xs text-gray-400">Amount due</div>
              <div className="text-xs">
                {paymentRequest?.amount?.toLocaleString()} Rwf
              </div>
            </div>

            {/* Request Attached Invoice*/}
            <div className="flex flex-col  space-y-2 ">
              <div className="text-xs text-gray-400">Attached Invoice(s)</div>
              <div className="grid grid-cols-2 gap-y-2">
                {paymentRequest?.docIds?.map((doc, i) => {
                  return (
                    <Link
                      href={`${url}/file/paymentRequests/${doc}`}
                      target="_blank"
                    >
                      <div className="text-xs">
                        <div className="flex flex-row space-x-1">
                          {" "}
                          <PaperClipOutlined /> Invoice {i + 1}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Approval flow */}
          <div>
            <Typography.Title level={4}>Request Approval</Typography.Title>
          </div>

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
                          {currentCode === 4 &&
                            !paymentRequest?.hod_approvalDate && (
                              <CloseOutlined className="h-5 w-5 text-red-500" />
                            )}
                          {currentCode > 1 &&
                            paymentRequest?.hod_approvalDate && (
                              <CheckOutlined className="h-5 w-5 text-green-500" />
                            )}
                        </div>
                        <div>
                          {currentCode === 4 &&
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
                            {currentCode === 4 &&
                              !paymentRequest?.hof_approvalDate && (
                                <CloseOutlined className="h-5 w-5 text-red-500" />
                              )}
                            {currentCode > 2 &&
                              paymentRequest?.hof_approvalDate && (
                                <CheckOutlined className="h-5 w-5 text-green-500" />
                              )}
                          </div>
                          <div>
                            {currentCode === 4 &&
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
              {paymentRequest?.reasonForRejection && 
              
              <div className="bg-red-50 p-2 rounded-md">
                {paymentRequest?.reasonForRejection}
              </div>
              }
            </div>
            
          )}

          {!paymentRequest?.approver && (
            <div className="flex flex-col space-y-2">
              <div className="text-xs text-gray-500">
                {showAddApproverForm ? "" : "No approver selected yet"}
              </div>
              {!showAddApproverForm && (
                <div className="flex flex-row items-center space-x-1">
                  <Button
                    type="primary"
                    onClick={() => setShowAddApproverForm(!showAddApproverForm)}
                  >
                    Add approver
                  </Button>
                </div>
              )}
              {showAddApproverForm && (
                <div className="flex flex-row items-center space-x-1">
                  <div
                    onClick={() => setShowAddApproverForm(!showAddApproverForm)}
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
                    options={level1Approvers.map((l) => {
                      return {
                        label: l?.firstName + " " + l?.lastName,
                        value: l?._id,
                      };
                    })}
                  ></Select>
                </Form.Item>

                <Form.Item>
                  <Button onClick={sendReview} type="primary">
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
                files={files}
                setFiles={setFiles}
                label="Select Payment proof"
              />

              <div>
                <Button onClick={()=>handleUpload()} type="primary" disabled={!files || files.length==0}>Submit</Button>
              </div>
            </>
          )}
          {paymentRequest?.status !== "approved" && paymentRequest?.status !== 'paid' && (
            <div className="text-sm text-gray-600 p-3 bg-gray-50 rounded-md flex flex-col justify-center items-center">
              <LockClosedIcon className="h-10 w-10 text-blue-400" />
              <p>
                This request needs to be approved for the payment process to
                start.
              </p>
            </div>
          )}

          {
            paymentRequest?.status === 'paid' &&
            <div className="flex flex-col  space-y-2 ">
              <div className="text-xs text-gray-400">Attached Payment proof(s)</div>
              <div className="grid grid-cols-2 gap-y-2">
                {paymentRequest?.paymentProofDocs?.map((doc, i) => {
                  return (
                    <Link
                      href={`${url}/file/paymentRequests/${doc}`}
                      target="_blank"
                    >
                      <div className="text-xs">
                        <div className="flex flex-row space-x-1">
                          {" "}
                          <PaperClipOutlined /> Invoice {i + 1}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          }
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
                  ((paymentRequest?.status == "approved" || paymentRequest?.status == "paid") && (
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