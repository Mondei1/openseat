import '@/styles/globals.css'
import '../styles/transitions.css';
import '../styles/editor.css'
import { NextUIProvider, createTheme } from '@nextui-org/react'
import { appWithTranslation } from 'next-i18next'
import { ThemeProvider } from 'next-themes'
import type { AppProps } from 'next/app'
import Transition from '@/components/Transition';
import Titlebar from '@/components/Titlebar';
import { SettingsProvider } from '@/components/SettingsContext';
import { IsClientContextProvider } from '@/components/IsClientContext';

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
      <Titlebar></Titlebar>
      <Transition>
        <NextUIProvider>
          <SettingsProvider>
            <IsClientContextProvider>
              <Component {...pageProps} />
            </IsClientContextProvider>
          </SettingsProvider>
        </NextUIProvider>
      </Transition>
    </ThemeProvider>
  )
}

export default appWithTranslation(App)