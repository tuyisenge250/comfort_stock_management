import React, { useState, useMemo } from "react";
import { Select, DatePicker, Table, Tag } from "antd";
import dayjs, { Dayjs } from "dayjs";

const { RangePicker } = DatePicker;

const users = {
  "user-456": {
    name: "Alice",
    telephone: "+250788123456",
    loans: [
      {
        productId: "pro-234",
        creditId: "credit_341",
        qty: 10,
        pricePerUnit: 30.0,
        totalAmount: 300,
        amountPaid: 100,
        remainingAmount: 200,
        loanDate: "2025-06-26",
        status: "LOANED",
        paymentStatus: "PARTIALLY_PAID",
        updatedDate: "2025-06-28",
      },
    ],
  },
  "user-123": {
    name: "Bob",
    telephone: "+250788654321",
    loans: [],
  },
  "user-432": {
    name: "Aline",
    telephone: "+250788123456",
    loans: [
      {
        productId: "pro-234",
        creditId: "credit_342",
        qty: 10,
        pricePerUnit: 30.0,
        totalAmount: 300,
        amountPaid: 0,
        remainingAmount: 300,
        loanDate: "2025-06-26",
        status: "LOANED",
        paymentStatus: "PENDING",
      },{
        productId: "pro-234",
        creditId: "credit_342",
        qty: 10,
        pricePerUnit: 30.0,
        totalAmount: 300,
        amountPaid: 0,
        remainingAmount: 300,
        loanDate: "2025-06-26",
        status: "LOANED",
        paymentStatus: "PAID",
      },
    ],
  },
};

const CreditReport: React.FC = () => {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);

  const allLoans = useMemo(() => {
    const records: any[] = [];

    Object.entries(users).forEach(([userId, user]) => {
      user.loans.forEach((loan) => {
        records.push({
          ...loan,
          userId,
          userName: user.name,
          telephone: user.telephone,
        });
      });
    });

    return records;
  }, []);

  const filtered = useMemo(() => {
    return allLoans.filter((loan) => {
      const matchUser =
        selectedUsers.length === 0 || selectedUsers.includes(loan.userId);
      const matchStatus =
        !selectedStatus || loan.paymentStatus === selectedStatus;
      const matchDate =
        !dateRange ||
        (dayjs(loan.loanDate).isSameOrAfter(dateRange[0], "day") &&
         dayjs(loan.loanDate).isSameOrBefore(dateRange[1], "day"));

      return matchUser && matchStatus && matchDate;
    });
  }, [allLoans, selectedUsers, selectedStatus, dateRange]);

  const columns = [
    {
      title: "User",
      dataIndex: "userName",
      key: "userName",
      render: (text: string, record: any) => (
        <div>
          <p className="font-medium">{text}</p>
          <p className="text-xs text-gray-500">{record.telephone}</p>
        </div>
      ),
    },
    {
      title: "Qty",
      dataIndex: "qty",
      key: "qty",
    },
    {
      title: "Price/Unit",
      dataIndex: "pricePerUnit",
      key: "pricePerUnit",
    },
    {
      title: "Total",
      dataIndex: "totalAmount",
      key: "totalAmount",
    },
    {
      title: "Paid",
      dataIndex: "amountPaid",
      key: "amountPaid",
    },
    {
      title: "Remaining",
      dataIndex: "remainingAmount",
      key: "remainingAmount",
    },
    {
      title: "Loan Date",
      dataIndex: "loanDate",
      key: "loanDate",
    },
    {
      title: "Updated",
      dataIndex: "updatedDate",
      key: "updatedDate",
      render: (date: string) => date || "—",
    },
    {
      title: "Status",
      dataIndex: "paymentStatus",
      key: "paymentStatus",
      render: (status: string) => {
        const color = {
          PENDING: "red",
          PARTIALLY_PAID: "orange",
          PAID: "green",
        }[status] || "gray";

        return <Tag color={color}>{status}</Tag>;
      },
    },
  ];

  return (
    <div className="p-4 bg-white rounded shadow max-w-full overflow-x-auto">
      <h2 className="text-xl font-semibold mb-4">Credit Report</h2>

      <div className="flex flex-wrap gap-4 mb-4">
        <Select
          mode="multiple"
          placeholder="Select user(s)"
          style={{ minWidth: 200 }}
          onChange={setSelectedUsers}
          options={Object.entries(users).map(([id, u]) => ({
            value: id,
            label: `${u.name} (${u.telephone})`,
          }))}
        />

        <RangePicker onChange={(val) => setDateRange(val)} />

        <Select
          allowClear
          placeholder="Payment Status"
          style={{ minWidth: 180 }}
          onChange={setSelectedStatus}
          options={[
            { value: "PENDING", label: "Not Paid" },
            { value: "PARTIALLY_PAID", label: "Partially Paid" },
            { value: "PAID", label: "Paid" },
          ]}
        />
      </div>

      <Table
        columns={columns}
        dataSource={filtered}
        rowKey="creditId"
        pagination={{ pageSize: 5 }}
        bordered
      />
    </div>
  );
};

export default CreditReport;
