"use client";
import React, { useState } from "react";
import { LoadingOutlined, UploadOutlined } from "@ant-design/icons";
import { Button, Upload, message, UploadFile, Spin } from "antd";
function UploadTenderDoc({ label, uuid, setTendeDocSelected, files, updateTender}) {
  const [messageApi, contextHolder] = message.useMessage();
  let url = process.env.NEXT_PUBLIC_BKEND_URL;
  let apiUsername = process.env.NEXT_PUBLIC_API_USERNAME;
  let apiPassword = process.env.NEXT_PUBLIC_API_PASSWORD;
  let token = localStorage.getItem("token");
  let [loading, setLoading] = useState(false);

  const props = {
    multiple: false,
    showUploadList: {
      showDownloadIcon: false,
    },

    onChange: ({ file, fileList }) => {
      let status = file.status;
      // setStatus(status);
      if (status == "uploading") setLoading(true);
      else {
        setLoading(false);
        if (status == "error") {
          messageApi.error("Failed to upload the file!");
        } else if (status == "removed") {
          messageApi.success("File removed!");
        } else {
          messageApi.success("Successfully uploaded the file!");
        }
      }
    },
    beforeUpload: (file) => {
      console.log('Fiiiiile', uuid)
      let isPDF = file.type == "application/pdf";
      if (!isPDF) {
        messageApi.error(`${file.name} is not a PDF file`);
        setTendeDocSelected(true);
      } else {
        setTendeDocSelected(true);
      }

      return isPDF || Upload.LIST_IGNORE;
    },
    action: `${url}/uploads/tenderDocs?id=${uuid}`,
    headers: {
      Authorization: "Basic " + window.btoa(`${apiUsername}:${apiPassword}`),
      token,
      token,
      "Content-Type": "application/json",
    },
    listType: "document",
    previewFile(file) {
      console.log("Your upload file:", file);
      // Your process logic. Here we just mock to the same file
      return fetch(`${url}/users/`, {
        method: "GET",
        body: file,
        headers: {
          Authorization:
            "Basic " + window.btoa(`${apiUsername}:${apiPassword}`),
          "Content-Type": "application/json",
        },
      })
        .then((res) => res.json())
        .then(({ thumbnail }) => thumbnail);
    },
  };
  return (
    <>
      {contextHolder}

      <Upload {...props} headers={{}} maxCount={1} defaultFileList={[...files]}>
        <Button icon={<UploadOutlined />} onClick={()=>updateTender(uuid)}>{label ? label : "Upload"}</Button>
      </Upload>
    </>
  );
}
export default UploadTenderDoc;
