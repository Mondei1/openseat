import { appWindow } from '@tauri-apps/api/window'
import { useEffect, useState } from 'react';
import { isClient } from '@/lib/is-client.ctx';

export default function Titlebar() {
  const [appWindow, setAppWindow] = useState()

  // Import appWindow and save it inside the state for later usage
  async function setupAppWindow() {
    const appWindow = (await import('@tauri-apps/api/window')).appWindow
    // @ts-ignore
    setAppWindow(appWindow)
  }

  useEffect(() => {
    console.log("Test")
    setupAppWindow()
    maximize()
  }, [])

  function minimize() {
    // @ts-ignore
    appWindow?.minimize()
  }

  function maximize() {
    // @ts-ignore
    appWindow?.maximize()
  }

  function close() {
    console.log("Close!");

    // @ts-ignore
    appWindow?.close()
  }

  return (
    <>
      <div data-tauri-drag-region className="titlebar" onClick={() => { alert() }}>
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