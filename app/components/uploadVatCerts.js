'use client'
import React from "react";
import { UploadOutlined } from "@ant-design/icons";
import { Button, Upload, message } from "antd";

function UploadVatCerts({ label, uuid, setId, setSelected }) {
  const [messageApi, contextHolder] = message.useMessage();
  let url = process.env.NEXT_PUBLIC_BKEND_URL;
  let apiUsername = process.env.NEXT_PUBLIC_API_USERNAME;
  let apiPassword = process.env.NEXT_PUBLIC_API_PASSWORD;
  let token = localStorage.getItem('token')

  const props = {
    beforeUpload: (file) => {
      let isPDF = file.type == "application/pdf";
      if (!isPDF) {
        messageApi.error(`${file.name} is not a PDF file`);
        setSelected(false)
      } else {
        // setId(uuid);
        setSelected(true)
      }
      return isPDF || Upload.LIST_IGNORE;
    },
    action: `${url}/uploads/vatCerts?id=${uuid}`,
    headers: {
      Authorization: "Basic " + window.btoa(`${apiUsername}:${apiPassword}`),
      token: token,
      "Content-Type": "application/json",
    },
    listType: "document",
    previewFile(file) {
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
      <Upload {...props} headers={{}}>
        <Button icon={<UploadOutlined />}>{label ? label : "Upload"}</Button>
      </Upload>
    </>
  );
}
export default UploadVatCerts;
