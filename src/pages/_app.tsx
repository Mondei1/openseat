import '@/styles/globals.css'
import '../styles/transition.css';
import { NextUIProvider, createTheme } from '@nextui-org/react'
import { appWithTranslation } from 'next-i18next'
import { ThemeProvider } from 'next-themes'
import type { AppProps } from 'next/app'
import Transition from './transition';

function App({ Component, pageProps }: AppProps) {
  // 2. Call `createTheme` and pass your custom values
  const lightTheme = createTheme({
    type: 'light'
  })

  const darkTheme = createTheme({
    type: 'dark'
  })

  return (
    <ThemeProvider
      defaultTheme='system'
      attribute='class'
      value={{
        light: lightTheme.className,
        dark: darkTheme.className
      }}
    >
      <NextUIProvider>
        <Component {...pageProps} />
      </NextUIProvider>
    </ThemeProvider>
  )
}

export default appWithTranslation(App)