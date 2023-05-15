
import React from 'react'
import Spinner from '../../components/spinner'

export default function loading() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
    <Spinner/>
  </div>
  )
}
