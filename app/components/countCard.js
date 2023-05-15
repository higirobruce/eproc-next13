"use client";

import { Card } from "antd";

export default function CountCard({ count, title, icon, color }) {
  return (
    <div className="flex flex-col justify-between space-y-2">
      <Card className="shadow-xl">
        <Card.Meta
          // avatar={<Avatar src="https://joesch.moe/api/v1/random?key=1" />}
          title={title}
          description={
            <div
              className={`flex flex-row items-center justify-between text-blue-400`}
            >
              <div>{icon}</div>
              <div className="text-xl">{count.toLocaleString()}</div>
            </div>
          }
        />
        {/* <Statistic
          title={title}
          value={count}
          valueStyle={{
            color: "#2299FF",
          }}
        /> */}
      </Card>
    </div>
  );
}
