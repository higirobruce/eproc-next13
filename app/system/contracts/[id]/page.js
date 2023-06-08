'use client'
import {
  CloseCircleOutlined,
  EditOutlined,
  EyeOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import {
  Typography,
  Popconfirm,
  Popover,
  Switch,
  Spin
} from "antd";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import parse from "html-react-parser";
import * as _ from "lodash";
import moment from "moment-timezone";

import dynamic from "next/dynamic";
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });
import "react-quill/dist/quill.snow.css";
import { encode } from "base-64";
let modules = {
  toolbar: [
    [{ header: [1, 2, false] }],
    ["bold", "italic", "underline", "strike", "blockquote"],
    [
      { list: "ordered" },
      { list: "bullet" },
      { indent: "-1" },
      { indent: "+1" },
    ],
    ["link"],
    ["clean"],
  ],
};

let formats = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "blockquote",
  "list",
  "bullet",
  "indent",
  "link",
];

let url = process.env.NEXT_PUBLIC_BKEND_URL;
let apiUsername = process.env.NEXT_PUBLIC_API_USERNAME;
let apiPassword = process.env.NEXT_PUBLIC_API_PASSWORD;

async function getContractDetails(id) {
  let token = localStorage.getItem('token')
  const res = await fetch(`${url}/contracts/${id}`, {
    headers: {
      Authorization: "Basic " + `${encode(`${apiUsername}:${apiPassword}`)}`,
      token: token,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    // This will activate the closest `error.js` Error Boundary
    // console.log(id);
    return null;
    // throw new Error("Failed to fetch data");
  }
  // console.log(res.json())
  return res.json();
}

export default function page({ params }) {
  let user = JSON.parse(localStorage.getItem("user"));
  let token = localStorage.getItem('token')
  let [contract, setContract] = useState({})

  let url = process.env.NEXT_PUBLIC_BKEND_URL;
  let apiUsername = process.env.NEXT_PUBLIC_API_USERNAME;
  let apiPassword = process.env.NEXT_PUBLIC_API_PASSWORD;
  
  const [editContract, setEditContract] = useState(false
  );
  const [signing, setSigning] = useState(false);
 

  useEffect(() => {
    getContractDetails(params?.id).then(res=>setContract(res))
  }, [params]);

  function handleSignContract(signatory, index) {
    setSigning(true);
    let myIpObj = "";
    signatory.signed = true;
    let _contract = { ...contract };

    fetch("https://api.ipify.org?format=json")
      .then((res) => res.json())
      .then((res) => {
        myIpObj = res;
        signatory.ipAddress = res?.ip;
        signatory.signedAt = moment();
        _contract.signatories[index] = signatory;
        setContract(_contract);

        fetch(`${url}/contracts/${contract?._id}`, {
          method: "PUT",
          headers: {
            Authorization: "Basic " + encode(`${apiUsername}:${apiPassword}`),
            token: token,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            newContract: contract,
            pending: contract?.status === "pending-signature",
            paritallySigned: documentFullySignedInternally(contract),
            signed: documentFullySigned(contract),
            signingIndex: index
          }),
        })
          .then((res) => res.json())
          .then((res) => {
            // setSignatories([]);
            // setSections([{ title: "Set section title", body: "" }]);
            let _c = {...contract};
            _c.signatories = res?.signatories;
            _c.status = res?.status
            setContract(_c);
            setSignatories(res?.signatories);
            setSigning(false);
          });
      })
      .catch((err) => {
        console.log(err);
        setSigning(false);
      });

    //call API to sign
  }

  function documentFullySigned(document) {
    let totSignatories = document?.signatories;
    let signatures = document?.signatories?.filter((s) => s.signed);

    return totSignatories?.length === signatures?.length;
  }

  function previousSignatorySigned(signatories, index) {
    let signed = index == 0 ? true : signatories[index - 1]?.signed;
    return signed;
  }

  function documentFullySigned(document) {
    let totSignatories = document?.signatories;
    let signatures = document?.signatories?.filter((s) => s.signed);

    return totSignatories?.length === signatures?.length;
  }

  function documentFullySignedInternally(document) {
    let totIntenalSignatories = document?.signatories?.filter(
      (s) => s.onBehalfOf === "Irembo Ltd"
    );
    let signatures = document?.signatories?.filter(
      (s) => s.signed && s.onBehalfOf === "Irembo Ltd"
    );

    return totIntenalSignatories?.length === signatures?.length;
  }

  return (
    <div className="space-y-10 px-20 py-5 overflow-x-scroll bg-white mx-11 my-10 shadow-md">
      {/* Header */}
      <div className="flex flex-row justify-between items-center">
        <Typography.Title level={4} className="flex flex-row items-center">
          <div>
            CONTRACTOR: {contract?.vendor?.companyName}{" "}
            <div>
              <Popover
                placement="topLeft"
                content={`${moment(contract?.startDate).format(
                  "YYYY-MMM-DD"
                )} - ${moment(contract?.endDate).format("YYYY-MMM-DD")}`}
              >
                <div className="text-xs font-thin text-gray-500">
                  Expires in {moment(contract?.endDate).fromNow()}
                </div>
              </Popover>
            </div>
          </div>
        </Typography.Title>
        {/* {contract?.status === "draft" &&
          user?.permissions?.canEditContracts && (
            <Switch
              checkedChildren={<EditOutlined />}
              unCheckedChildren={<EyeOutlined />}
              defaultChecked={editContract}
              onChange={(checked) => setEditContract(checked)}
            />
          )} */}
      </div>
      {/* Parties */}
      <div className="grid grid-cols-2 gap-5 ">
        <div className="flex flex-col ring-1 ring-gray-300 rounded p-5 space-y-3">
          <div className="flex flex-col">
            <Typography.Text type="secondary">
              <div className="text-xs">Company Name</div>
            </Typography.Text>
            <Typography.Text strong>Irembo ltd</Typography.Text>
          </div>

          <div className="flex flex-col">
            <Typography.Text type="secondary">
              <div className="text-xs">Company Address</div>
            </Typography.Text>
            <Typography.Text strong>
              Irembo Campass Nyarutarama KG 9 Ave
            </Typography.Text>
          </div>

          <div className="flex flex-col">
            <Typography.Text type="secondary">
              <div className="text-xs">Company TIN no.</div>
            </Typography.Text>
            <Typography.Text strong>102911562</Typography.Text>
          </div>

          <div className="flex flex-col">
            <Typography.Text type="secondary">
              <div className="text-xs">Hereinafter refferd to as</div>
            </Typography.Text>
            <Typography.Text strong>Sender</Typography.Text>
          </div>
        </div>

        <div className="flex flex-col ring-1 ring-gray-300 rounded p-5 space-y-3">
          <div className="flex flex-col">
            <Typography.Text type="secondary">
              <div className="text-xs">Company Name</div>
            </Typography.Text>
            <Typography.Text strong>
              {contract?.vendor?.companyName}
            </Typography.Text>
          </div>

          <div className="flex flex-col">
            <Typography.Text type="secondary">
              <div className="text-xs">Company Address</div>
            </Typography.Text>
            <Typography.Text strong>
              {contract?.vendor?.hqAddress}-{contract?.vendor?.country}
            </Typography.Text>
          </div>
          <div className="flex flex-col">
            <Typography.Text type="secondary">
              <div className="text-xs">Company TIN no.</div>
            </Typography.Text>
            <Typography.Text strong>{contract?.vendor?.tin}</Typography.Text>
          </div>
          <div className="flex flex-col">
            <Typography.Text type="secondary">
              <div className="text-xs">Hereinafter refferd to as</div>
            </Typography.Text>
            <Typography.Text strong>Receiver</Typography.Text>
          </div>
        </div>
      </div>
      {/* Details */}
      <div className="flex flex-col space-y-5">
        <Typography.Title level={3}>Details</Typography.Title>
        {contract?.sections?.map((s, index) => {
          let section = contract?.sections[index]
            ? contract?.sections[index]
            : { title: "", body: "" };
          let _sections = [...contract?.sections];
          return (
            <>
              <div className="flex flex-row justify-between items-center">
                <Typography.Title
                  level={4}
                  editable={
                    editContract &&
                    contract?.status === "draft" && {
                      onChange: (e) => {
                        section.title = e;
                        _sections[index]
                          ? (_sections[index] = section)
                          : _sections.push(section);
                      },
                      text: s.title,
                    }
                  }
                >
                  {s.title}
                </Typography.Title>
                {editContract && contract?.status === "draft" && (
                  <Popconfirm
                    onConfirm={() => {
                      let _sections = [...sections];
                      _sections.splice(index, 1);
                    }}
                    title="You can not undo this!"
                  >
                    <div>
                      <CloseCircleOutlined className="h-3 text-red-400 cursor-pointer" />
                    </div>
                  </Popconfirm>
                )}
              </div>
              {(!editContract || contract?.status !== "draft") && (
                <div>{parse(s?.body)}</div>
              )}
              {editContract && contract?.status === "draft" && (
                <ReactQuill
                  theme="snow"
                  modules={modules}
                  formats={formats}
                  value={s.body}
                  onChange={(value) => {
                    section.body = value;
                    _sections[index]
                      ? (_sections[index] = section)
                      : _sections.push(section);
                  }}
                />
              )}
            </>
          );
        })}
        {/* {editContract && contract?.status === "draft" && (
              <Button
                icon={<PlusOutlined />}
                onClick={() => {
                  let _sections = [...sections];
                  _sections.push({
                    title: `Set section ${contract?.sections?.length + 1} Title`,
                    body: "",
                  });
                  setSections(_sections);
                }}
              >
                Add section
              </Button>
            )} */}
      </div>
      {/* Signatories */}
      <div className="grid grid-cols-3 gap-5">
        {contract?.signatories?.map((s, index) => {
          let yetToSign = contract?.signatories?.filter((notS) => {
            return !notS.signed;
          });
          return (
            <div
              key={s?.email}
              className="flex flex-col ring-1 ring-gray-300 rounded pt-5 space-y-3 justify-between"
            >
              <div className="px-5 flex flex-col space-y-3">
                <div className="flex flex-col">
                  <Typography.Text type="secondary">
                    <div className="text-xs">On Behalf of</div>
                  </Typography.Text>
                  <Typography.Text
                    strong
                    editable={
                      editContract &&
                      contract?.status === "draft" && {
                        text: s.onBehalfOf,
                        onChange: (e) => {
                          let _signatories = [...contract?.signatories];
                          _signatories[index].onBehalfOf = e;
                          setSignatories(_signatories);
                        },
                      }
                    }
                  >
                    {s.onBehalfOf}
                  </Typography.Text>
                </div>

                <div className="flex flex-col">
                  <Typography.Text type="secondary">
                    <div className="text-xs">Representative Title</div>
                  </Typography.Text>
                  <Typography.Text
                    strong
                    editable={
                      editContract &&
                      contract?.status === "draft" && {
                        text: s.title,
                        onChange: (e) => {
                          let _signatories = [...contract?.signatories];
                          _signatories[index].title = e;
                          setSignatories(_signatories);
                        },
                      }
                    }
                  >
                    {s.title}
                  </Typography.Text>
                </div>

                <div className="flex flex-col">
                  <Typography.Text type="secondary">
                    <div className="text-xs">Company Representative</div>
                  </Typography.Text>
                  <Typography.Text
                    strong
                    editable={
                      editContract &&
                      contract?.status === "draft" && {
                        text: s.names,
                        onChange: (e) => {
                          let _signatories = [...contract?.signatories];
                          _signatories[index].names = e;
                          setSignatories(_signatories);
                        },
                      }
                    }
                  >
                    {s.names}
                  </Typography.Text>
                </div>

                <div className="flex flex-col">
                  <Typography.Text type="secondary">
                    <div className="text-xs">Email</div>
                  </Typography.Text>
                  <Typography.Text
                    strong
                    editable={
                      editContract &&
                      contract?.status === "draft" && {
                        text: s.email,
                        onChange: (e) => {
                          let _signatories = [...contract?.signatories];
                          _signatories[index].email = e;
                          setSignatories(_signatories);
                        },
                      }
                    }
                  >
                    {s.email}
                  </Typography.Text>
                </div>

                {s.signed && (
                  <>
                    {!signing && (
                      <div className="flex flex-col">
                        <Typography.Text type="secondary">
                          <div className="text-xs">IP address</div>
                        </Typography.Text>
                        <Typography.Text strong>{s?.ipAddress}</Typography.Text>
                      </div>
                    )}
                    {signing && (
                      <Spin
                        indicator={
                          <LoadingOutlined
                            className="text-gray-500"
                            style={{ fontSize: 20 }}
                            spin
                          />
                        }
                      />
                    )}
                  </>
                )}
              </div>
              {s?.signed && (
                <div className="flex flex-row justify-center space-x-10 items-center border-t-2 bg-blue-50 p-5">
                  <Image
                    width={40}
                    height={40}
                    src="/icons/icons8-signature-80.png"
                  />

                  <div className="text-blue-500 flex flex-col">
                    <div className="text-lg">Signed digitaly</div>
                    <div>{moment(s.signedAt).format("DD MMM YYYY")} at</div>
                    <div>
                      {moment(s.signedAt)
                        .tz("Africa/Kigali")
                        .format("h:mm a z")}
                    </div>
                  </div>
                </div>
              )}

              {(user?.email === s?.email || user?.tempEmail === s?.email) &&
                !s?.signed &&
                previousSignatorySigned(contract?.signatories, index) && (
                  <Popconfirm
                    title="Confirm Contract Signature"
                    onConfirm={() => handleSignContract(s, index)}
                  >
                    <div className="flex flex-row justify-center space-x-5 items-center border-t-2 bg-blue-50 p-5 cursor-pointer hover:opacity-75">
                      <Image
                        width={40}
                        height={40}
                        src="/icons/icons8-signature-80.png"
                      />
                      <div className="text-blue-400 text-lg">
                        It is your turn, sign with one click
                      </div>
                    </div>
                  </Popconfirm>
                )}

              {((user?.email !== s?.email &&
                user?.tempEmail !== s?.email &&
                !s.signed) ||
                !previousSignatorySigned(contract?.signatories, index)) && (
                <div className="flex flex-row justify-center space-x-5 items-center border-t-2 bg-gray-50 p-5">
                  <Image
                    width={40}
                    height={40}
                    src="/icons/icons8-signature-80-2.png"
                  />
                  <div className="text-gray-400 text-lg">
                    {s.signed
                      ? "Signed"
                      : `Waiting for ${yetToSign[0]?.names}'s signature`}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
