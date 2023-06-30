"use client";
import { QuestionCircleOutlined } from "@ant-design/icons";
import { Button, Form, Input, InputNumber, Popconfirm, Select, Table, Tooltip } from "antd";
import React, { useContext, useEffect, useRef, useState } from "react";
import { v4 } from "uuid";
import UploadTORs from "./uploadTORs";

const EditableContext = React.createContext(null);
const EditableRow = ({ index, rowForm, ...props }) => {
  const [form] = Form.useForm();
  return (
    <Form form={form} component={false}>
      <EditableContext.Provider value={form}>
        <tr {...props} />
      </EditableContext.Provider>
    </Form>
  );
};

const EditableCell = ({
  title,
  editable,
  children,
  dataIndex,
  record,
  handleSave,
  ...restProps
}) => {
  const [editing, setEditing] = useState(true);
  const inputRef = useRef(null);
  const form = useContext(EditableContext);
  useEffect(() => {
    if (editing) {
      inputRef?.current?.focus();
    }
  }, [editing]);
  const toggleEdit = () => {
    setEditing(!editing);
    form.setFieldsValue({
      [dataIndex]: record[dataIndex],
    });
  };
  const save = async () => {
    try {
      const values = await form.validateFields();
      toggleEdit();
      handleSave({
        ...record,
        ...values,
      });
    } catch (errInfo) {
      console.log("Save failed:", errInfo);
    }
  };
  let childNode = children;

  if (editable) {
    childNode = editing ? (
      <Form.Item
        style={{
          margin: 0,
        }}
        name={dataIndex}
        rules={(dataIndex == 'quantity' || dataIndex=='estimatedUnitCost') ? [
          {
            required: true,
            message: `Input required.`,
          },
          {
            pattern: new RegExp("([0-9])+"),
            message: "Should be a number",
          },
        ] :  [
          {
            required: true,
            message: `Input required.`,
          },
        ]}
      >
        {(dataIndex == 'quantity' || dataIndex=='estimatedUnitCost') ? <InputNumber
          className="w-full"
          ref={inputRef}
          onPressEnter={save}
          placeholder={dataIndex === "title" ? "enter title" : "eg. 1000000"}
          onBlur={save}
        /> : <Input
        ref={inputRef}
        onPressEnter={save}
        placeholder={dataIndex === "title" ? "enter title" : "eg. 1000000"}
        onBlur={save}
      />}
        
      </Form.Item>
    ) : (
      <div
        className="editable-cell-value-wrap"
        style={{
          paddingRight: 24,
        }}
        onClick={toggleEdit}
      >
        {children}
      </div>
    );
  }
  return <td {...restProps}>{childNode}</td>;
};

const ItemsTable = ({
  setDataSource,
  dataSource,
  setFileList,
  fileList,
  files,
  setFiles,
}) => {
  const [count, setCount] = useState(1);
  const [rowForm] = Form.useForm();
  const handleDelete = (key) => {
    const newData = dataSource.filter((item) => item.key !== key && item.key);
    setCount(count - 1);
    setDataSource(newData);
  };
  const defaultColumns = [
    {
      title: "Item title",
      dataIndex: "title",
      width: "20%",
      editable: true,
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      width: "15%",
      editable: true,
    },
    {
      title: "Estimated Unit cost",
      dataIndex: "estimatedUnitCost",
      width: "15%",
      editable: true,
    },
    {
      title: "Currency",
      dataIndex: "currency",
      width: "10%",
      render: (_, record) => {
        return (
          <Select
            defaultValue="RWF"
            onChange={(value) => (record.currency = value)}
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
          />
        );
      },
    },
    {
      title: (
        <div className="flex flex-row space-x-1 items-center">
          <div>Supporting Docs</div>
          <Tooltip
            title="(e.g specs, ToR,... expected in PDF format)"
            placement="top"
            arrow={false}
          >
            <QuestionCircleOutlined />
          </Tooltip>
        </div>
      ),
      dataIndex: "attachements",
      width: "20%",
      render: (_, record) =>
        dataSource.length >= 1 ? (
          <UploadTORs
            uuid={record?.key - 1}
            setFileList={setFileList}
            fileList={fileList}
            files={files}
            setFiles={setFiles}
          />
        ) : null,
    },
    {
      title: "Action",
      dataIndex: "operation",
      render: (_, record) =>
        dataSource.length >= 1 ? (
          <Popconfirm
            title="Are you sure?"
            onConfirm={() => handleDelete(record.key)}
          >
            <a>Delete</a>
          </Popconfirm>
        ) : null,
    },
  ];
  const handleAdd = () => {
    const newData = {
      key: count,
      title: ``,
      quantity: "",
      estimatedUnitCost: "",
      currency: "RWF",
      id: v4(),
    };

    setDataSource([...dataSource, newData]);
    setCount(count + 1);
  };

  const handleSave = (row) => {
    const newData = [...dataSource];
    const index = newData.findIndex((item) => row.key === item.key);
    const item = newData[index];
    newData.splice(index, 1, {
      ...item,
      ...row,
    });
    setDataSource(newData);
  };
  const components = {
    body: {
      row: EditableRow,
      cell: EditableCell,
    },
  };

  const columns = defaultColumns.map((col) => {
    if (!col.editable) {
      return col;
    }
    return {
      ...col,
      onCell: (record) => ({
        record,
        editable: col.editable,
        dataIndex: col.dataIndex,
        title: col.title,
        handleSave,
      }),
    };
  });

  return (
    <div>
      <Button
        onClick={handleAdd}
        type="primary"
        style={{
          marginBottom: 16,
        }}
      >
        Add a row
      </Button>
      <Table
        components={components}
        rowClassName={() => "editable-row"}
        bordered
        dataSource={dataSource}
        columns={columns}
        size="small"
      />
    </div>
  );
};
export default ItemsTable;
