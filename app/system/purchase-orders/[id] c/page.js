import React from 'react'

export default function page({params}) {
  return (
    <div>
      Purchase Order {params?.id}
    </div>
  )
}
