"use client";
import { LoadingOutlined } from "@ant-design/icons";
import { Button, Form, Input, message, Spin } from "antd";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import React, { useState } from "react";
import { encode } from "base-64";
import { motion } from "framer-motion";

export default function page({ params }) {
  const [form] = Form.useForm();
  const [dataLoaded, setDataLoaded] = useState(false);
  let url = process.env.NEXT_PUBLIC_BKEND_URL;
  let apiUsername = process.env.NEXT_PUBLIC_API_USERNAME;
  let apiPassword = process.env.NEXT_PUBLIC_API_PASSWORD;
  const [messageApi, contextHolder] = message.useMessage();
  // let user = JSON.parse(localStorage.getItem("user"));
  let [dataset, setDataset] = useState([]);
  let [updatingId, setUpdatingId] = useState("");
  let [row, setRow] = useState(null);
  let [segment, setSegment] = useState("Permissions");
  let [usersRequests, setUsersRequests] = useState([]);

  let [rowData, setRowData] = useState(null);
  let [vendorsBids, setVendorsBids] = useState([]);
  const [previewAttachment, setPreviewAttachment] = useState(false);
  const [attachmentId, setAttachmentId] = useState(null);
  const [editVendor, setEditVendor] = useState(false);
  let [servCategories, setServCategories] = useState([]);
  let searchParams = useSearchParams();

  let router = useRouter();
  let [submitting, setSubmitting] = useState(false);

  const antIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />;

  function onFinish(values) {
    setSubmitting(true);
    let userId = searchParams.get("userId");
    let token = searchParams.get("token");
    let newPassword = values?.newPassword;

    fetch(`${url}/users/resetPassword/${userId}`, {
      method: "PUT",
      headers: {
        Authorization: "Basic " + encode(`${apiUsername}:${apiPassword}`),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token,
        newPassword,
      }),
    }).then((res) => {
      if (res.ok) {
        router.push("/auth");
        setSubmitting(false);
      } else {
        messageApi.error("Something went wrong!!");
        setSubmitting(false);
      }
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{
        opacity: 1,
      }}
      transition={{
        duration: 0.3,
        type: "tween",
        ease: "circOut",
      }}
      className="flex flex-col bg-gray-50 items-center justify-center rounded shadow-md h-screen md:px-20"
    >
      {contextHolder}

      <div className="bg-white ring-1 ring-gray-100 rounded shadow p-5 w-1/3">
        <div className="text-xl font-semibold mb-5 flex flex-row justify-between items-center">
          <div>Reset password</div>
        </div>
        <Form
          // {...formItemLayout}
          form={form}
          name="register"
          onFinish={onFinish}
          scrollToFirstError
          style={{ width: "100%" }}
        >
          <div>
            <div>New password</div>
            <Form.Item
              name="newPassword"
              // label="Password"
              rules={[
                {
                  required: true,
                  message: "Please input your new password!",
                },
              ]}
              hasFeedback
            >
              <Input.Password />
            </Form.Item>
          </div>

          <div>
            <div>Confirm new password</div>
            <Form.Item
              name="confirmPassword"
              // label="Password"
              rules={[
                {
                  required: true,
                  message: "Please confirm your password!",
                },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("newPassword") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error(
                        "The two passwords that you entered do not match!"
                      )
                    );
                  },
                }),
              ]}
              hasFeedback
            >
              <Input.Password />
            </Form.Item>
          </div>

          <Form.Item>
            {submitting ? (
              <Spin indicator={antIcon} />
            ) : (
              <div className="flex flex-row items-center justify-between">
                <Button type="primary" danger htmlType="submit">
                  Update my password
                </Button>
              </div>
            )}
          </Form.Item>
        </Form>
      </div>
    </motion.div>
  );
}
