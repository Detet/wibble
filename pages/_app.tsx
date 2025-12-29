import { FC } from 'react'
import type { AppProps } from 'next/app'
import { SocketProvider } from '../contexts/SocketContext'

import '@/styles/reset.css'

const App: FC<AppProps> = ({ Component, pageProps }) => {
  return (
    <SocketProvider>
      <Component {...pageProps} />
    </SocketProvider>
  )
}

export default App
