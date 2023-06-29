"use client";
import React, { useEffect, useState } from "react";
import { encode } from "base-64";
import { useRouter } from "next/navigation";
import { Button, message, Switch, Typography } from "antd";
import {
  ArrowLeftOutlined,
  EditOutlined,
  EyeOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import RequestDetails from "../../../components/requestDetails";
import { motion } from "framer-motion";

let url = process.env.NEXT_PUBLIC_BKEND_URL;
let apiUsername = process.env.NEXT_PUBLIC_API_USERNAME;
let apiPassword = process.env.NEXT_PUBLIC_API_PASSWORD;

async function geRequestDetails(id) {
  let token = localStorage.getItem("token");
  const res = await fetch(`${url}/requests/${id}`, {
    headers: {
      Authorization: "Basic " + `${encode(`${apiUsername}:${apiPassword}`)}`,
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

export default function page({ params }) {
  let router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();
  let user = JSON.parse(localStorage.getItem("user"));
  let [loadingRowData, setLoadingRowData] = useState(false);
  let [confirmRejectLoading, setConfirmRejectLoading] = useState(false);
  let [reload, setReload] = useState(false);
  const [editRequest, setEditRequest] = useState(false);
  const [sourcingMethod, setSourcingMethod] = useState("");

  let token = localStorage.getItem("token");
  let [rowData, setRowData] = useState(null);
  let [filePaths, setFilePaths] = useState([]);
  let [fileList, setFileList] = useState([]);
  let [files, setFiles] = useState([]);

  useEffect(() => {
    geRequestDetails(params?.id).then((res) => {
      setRowData(res);
    });
  }, []);

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
      .then((res) => res.json())
      .then((res) => {
        setRowData(res);
        setLoadingRowData(false);
        if (status === "withdrawn") router.back();
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
        setRowData(res);
      })
      .catch((err) => {
        messageApi.open({
          type: "error",
          content: "Something happened! Please try again.",
        });
      });
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
      .then((res) => res.json())
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

  function declineRequest(id, reason, declinedBy) {
    // setUpdatingId(id);
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
      .then((res) => res.json())
      .then((res) => {
        setRowData(res);
        setConfirmRejectLoading(false);
      })
      .catch((err) => {
        console.log(err);
        setConfirmRejectLoading(false);
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
      .then((res) => res.json())
      .then((res) => {
        setReload(!reload);
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
    return fetch(`${url}/purchaseOrders/`, {
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
        items,
        B1Data,
        request: rowData?._id,
        signatories,
        request,
        reqAttachmentDocId,
      }),
    })
      .then((res) => res.json())
      .then((res1) => {
        if (res1.error || res1.code) {
          messageApi.open({
            type: "error",
            content: res1.message?.value,
          });
        } else {
          updateStatus(rowData._id, "approved");
          updateSourcingMethod(rowData._id, sourcingMethod);
          messageApi.open({
            type: "success",
            content: "PO created!",
          });
        }
      })
      .catch((err) => {
        console.error(err);
        setLoadingRowData(false);
        messageApi.open({
          type: "error",
          content: JSON.stringify(err),
        });
      });
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
      .then((res) => res.json())
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
      .then((res) => res.json())
      .then((res) => {
        setReload(!reload);
        setLoadingRowData(false);
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
      .then((res) => res.json())
      .then((res) => {
        setRowData(res);
        setLoadingRowData(false);
      })
      .catch((err) => {
        setLoadingRowData(false);
        messageApi.open({
          type: "error",
          content: "Something happened! Please try again.",
        });
      })
      .finally(() => {
        setEditRequest(false);
      });
  }

  useEffect(() => {
    console.log("Files chaaaaanged");
    console.log(files);
  }, [files]);

  const handleUpload = (myFiles) => {
    let _filesPaths = [...myFiles]

    let i=0
    let _totalFilesInitial = rowData?.items?.map(item=>{
     
      item?.paths?.map(p=> {if(p) i++})
    })

    if (_filesPaths?.length < 1) {
      messageApi.error("Please add at least one doc.");
      // setConfirmLoading(false);
    } else {
      _filesPaths.forEach(
        (filesPerRow, rowIndex) => {
          
          filesPerRow?.map((rowFile, fileIndex) => {
            const formData = new FormData();
            formData.append("files[]", rowFile);
            
            console.log('Form data', formData)
            // You can use any AJAX library you like
            fetch(`${url}/uploads/termsOfReference/`, {
              method: "POST",
              body: formData,
              headers: {
                Authorization:
                  "Basic " + encode(`${apiUsername}:${apiPassword}`),
                token: token,
                // "Content-Type": "multipart/form-data",
              },
            })
              .then((res) => res.json())
              .then((savedFiles) => {
                let _filenames = savedFiles?.map((f) => {
                  return f?.filename;
                });

                let _files = [..._filesPaths];
                _files[rowIndex][fileIndex] = _filenames[0];

                console.log("File Naeeeeemememee", savedFiles);

                if (
                  rowIndex === _filesPaths?.length - 1 &&
                  fileIndex === filesPerRow.length - 1
                ) {
                  // save(_files);
                  updateRequest();
                }
              })
              .catch((err) => {
                console.log(err);
                messageApi.error("upload failed.");
              })
              .finally(() => {});
          });
        }
      );
    }
  };

  return (
    // <h1>{rowData?.number}</h1>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{
        opacity: rowData ? 1 : 0,
      }}
      transition={{
        duration: 0.2,
        type: "tween",
        ease: "circOut",
      }}
      className="flex flex-col mx-10 transition-opacity ease-in-out duration-1000 py-5 flex-1 space-y-3 h-full"
    >
      {contextHolder}
      <div className="flex flex-row justify-between items-center">
        <div className="flex flex-row space-x-10 items-center">
          <div>
            <Button
              icon={<ArrowLeftOutlined />}
              type="primary"
              onClick={() => {
                setEditRequest(false);
                router.back();
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
                    text: rowData?.title,
                    onChange: (e) => {
                      let req = { ...rowData };
                      req.title = e;
                      setRowData(req);
                    },
                  }
                }
              >
                {rowData?.title}
              </Typography.Text>
            </div>
          )}

          {editRequest && (
            <div>
              <Button
                icon={<SaveOutlined />}
                type="primary"
                onClick={() => {
                  updateRequest()
                }}
              >
                Save
              </Button>
            </div>
          )}

          {!editRequest && (
            <div className="text-xl font-semibold">
              Request - {rowData?.title}
            </div>
          )}
        </div>
        {(rowData?.level1Approver?._id === user?._id ||
          rowData?.createdBy?._id === user?._id) &&
          rowData?.status !== "approved" && (
            <Switch
              checked={editRequest}
              checkedChildren={<EditOutlined />}
              unCheckedChildren={<EyeOutlined />}
              onChange={(e) => setEditRequest(e)}
            />
          )}
      </div>
      {rowData && (
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
          handleUpdateRequest={setRowData}
          handleRateDelivery={rateDelivery}
          refDoc={sourcingMethod}
          setRefDoc={setSourcingMethod}
          setFilePaths={setFilePaths}
          fileList={fileList}
          files={files}
          setFileList={setFileList}
          setFiles={setFiles}
        />
      )}
    </motion.div>
  );
}
