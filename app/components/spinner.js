'use client'
import { LoadingOutlined } from '@ant-design/icons'
import { Spin } from 'antd'
import React from 'react'

export default function Spinner() {
  return (
    <Spin size='default' spinning={true} indicator={<LoadingOutlined />}/>
  )
}
