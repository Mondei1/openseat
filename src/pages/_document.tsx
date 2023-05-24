import Titlebar from '@/components/Titlebar'
import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body>
        <Titlebar></Titlebar>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
