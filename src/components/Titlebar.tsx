import { WebviewWindow } from '@tauri-apps/api/window'
import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import clsx from 'clsx';
import { SettingsContext } from './SettingsContext';

export default function Titlebar() {
  const [appWindow, setAppWindow] = useState<WebviewWindow>()
  const [transparent, setTransparent] = useState(false)

  const router = useRouter()
  const settings = useContext(SettingsContext)

  // Import appWindow and save it inside the state for later usage
  async function setupAppWindow() {
    const appWindow: WebviewWindow = (await import('@tauri-apps/api/window')).appWindow
    // @ts-ignore
    setAppWindow(appWindow)
  }

  useEffect(() => {
    router.events.on('routeChangeComplete', (e: string) => {
      setTransparent(e.indexOf('/editor') !== -1)
    })

    setupAppWindow()
  }, [])

  function minimize() {
    appWindow!.minimize()
  }

  async function maximize() {
    if (await appWindow!.isMaximized()) {
      appWindow!.unmaximize()
    } else {
      appWindow!.maximize()
    }
  }

  function close() {
    console.log("Close!");

    appWindow!.close()
  }

  return (
    <>
      <div data-tauri-drag-region className={clsx('titlebar', transparent ? 'titlebar-transparent' : null)}>
        <button className="titlebar-button" onClick={minimize}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M6.975 21q-.425 0-.7-.288T6 20q0-.425.288-.713T7 19h10.025q.425 0 .7.288T18 20q0 .425-.288.713T17 21H6.975Z" /></svg>
        </button>
        <button className="titlebar-button" onClick={maximize}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M4 4h16v16H4V4m2 4v10h12V8H6Z" /></svg>
        </button>
        <button className="titlebar-button" onClick={close}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M6.4 19L5 17.6l5.6-5.6L5 6.4L6.4 5l5.6 5.6L17.6 5L19 6.4L13.4 12l5.6 5.6l-1.4 1.4l-5.6-5.6L6.4 19Z" /></svg>
        </button>
      </div>
    </>
  )
}