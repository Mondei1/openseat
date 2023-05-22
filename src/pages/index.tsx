import Image from 'next/image'
import { Inter } from 'next/font/google'
import { Button, Card, Grid, Text } from '@nextui-org/react'
import { useEffect } from 'react'
import { open, save } from '@tauri-apps/api/dialog'
import Database from 'tauri-plugin-sql-api'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

import { useTheme as useNextTheme } from 'next-themes'
import { Switch, useTheme } from '@nextui-org/react'
import { invoke } from '@tauri-apps/api'

const inter = Inter({ subsets: ['latin'] })

// @ts-ignore
export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, [
        'common'
      ])),
      // Will be passed to the page component as props
    },
  }
}

export default function Home() {
  // Theme
  const { setTheme } = useNextTheme();
  const { isDark, type } = useTheme();

  const { t, i18n } = useTranslation('common');
  const router = useRouter();

  async function newProject() {
    let databasePath = await save({
      filters: [{
        name: 'OpenSeat database',
        extensions: ['osdb']
      }]
    });

    if (databasePath === null) {
      return
    }

    if (!databasePath.toLowerCase().endsWith(".osdb")) {
      databasePath += ".osdb"
    }

    router.push({
      pathname: "/setup",
      query: {
        databasePath
      }
    })

    //const { invoke } = window.__TAURI__.tauri
    //console.log(invoke);

    //console.log("Locale: " + await invoke("get_default_locale"))
  }

  async function openProject() {
    let databasePath = await open({
      multiple: false,
      filters: [{
        name: 'OpenSeat database',
        extensions: ['osdb'],
      }]
    });

    if (databasePath === null) {
      return
    }

    // We should never hit that path since "multiple" is disabled above.
    if (Array.isArray(databasePath)) {
      return;
    }

    if (!databasePath.toLowerCase().endsWith(".osdb")) {
      databasePath += ".osdb"
    }

    router.push({
      pathname: "/editor",
      query: {
        databasePath
      }
    })
  }


  return (
    <main className="min-h-screen justify-center">
      <div className="main flex flex-col justify-center content-center p-24">
        <div className="flex items-center">
          <h1 className="me-6">{t("app_name")}</h1>
          <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
            <path d="M5 10v-4a3 3 0 0 1 3 -3h8a3 3 0 0 1 3 3v4"></path>
            <path d="M16 15v-2a3 3 0 1 1 3 3v3h-14v-3a3 3 0 1 1 3 -3v2"></path>
            <path d="M8 12h8"></path>
            <path d="M7 19v2"></path>
            <path d="M17 19v2"></path>
          </svg>
        </div>

        <Grid.Container gap={8} justify="center">
          <Grid xs={6}>
            <Card>
              <Link href="#" onClick={newProject}>
                <Card.Body className="flex justify-items">
                  <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                    <path d="M14 3v4a1 1 0 0 0 1 1h4"></path>
                    <path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z"></path>
                    <path d="M12 11l0 6"></path>
                    <path d="M9 14l6 0"></path>
                  </svg>

                  <Text>{t("project_new")}</Text>
                </Card.Body>
              </Link>
            </Card>
          </Grid>
          <Grid xs={6}>
            <Card>
              <Link href='' onClick={openProject}>
                <Card.Body className="flex justify-items">
                  <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                    <path d="M14 3v4a1 1 0 0 0 1 1h4"></path>
                    <path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z"></path>
                    <path d="M9 9l1 0"></path>
                    <path d="M9 13l6 0"></path>
                    <path d="M9 17l6 0"></path>
                  </svg>
                  <Text>{t("project_open")}</Text>
                </Card.Body>
              </Link>
            </Card>
          </Grid>
        </Grid.Container>
      </div>

      <div className="flex justify-center items-center gap-4">
        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
          <path d="M12 19a1 1 0 0 1 .993 .883l.007 .117v1a1 1 0 0 1 -1.993 .117l-.007 -.117v-1a1 1 0 0 1 1 -1z" strokeWidth="0" fill="currentColor"></path>
          <path d="M18.313 16.91l.094 .083l.7 .7a1 1 0 0 1 -1.32 1.497l-.094 -.083l-.7 -.7a1 1 0 0 1 1.218 -1.567l.102 .07z" strokeWidth="0" fill="currentColor"></path>
          <path d="M7.007 16.993a1 1 0 0 1 .083 1.32l-.083 .094l-.7 .7a1 1 0 0 1 -1.497 -1.32l.083 -.094l.7 -.7a1 1 0 0 1 1.414 0z" strokeWidth="0" fill="currentColor"></path>
          <path d="M4 11a1 1 0 0 1 .117 1.993l-.117 .007h-1a1 1 0 0 1 -.117 -1.993l.117 -.007h1z" strokeWidth="0" fill="currentColor"></path>
          <path d="M21 11a1 1 0 0 1 .117 1.993l-.117 .007h-1a1 1 0 0 1 -.117 -1.993l.117 -.007h1z" strokeWidth="0" fill="currentColor"></path>
          <path d="M6.213 4.81l.094 .083l.7 .7a1 1 0 0 1 -1.32 1.497l-.094 -.083l-.7 -.7a1 1 0 0 1 1.217 -1.567l.102 .07z" strokeWidth="0" fill="currentColor"></path>
          <path d="M19.107 4.893a1 1 0 0 1 .083 1.32l-.083 .094l-.7 .7a1 1 0 0 1 -1.497 -1.32l.083 -.094l.7 -.7a1 1 0 0 1 1.414 0z" strokeWidth="0" fill="currentColor"></path>
          <path d="M12 2a1 1 0 0 1 .993 .883l.007 .117v1a1 1 0 0 1 -1.993 .117l-.007 -.117v-1a1 1 0 0 1 1 -1z" strokeWidth="0" fill="currentColor"></path>
          <path d="M12 7a5 5 0 1 1 -4.995 5.217l-.005 -.217l.005 -.217a5 5 0 0 1 4.995 -4.783z" strokeWidth="0" fill="currentColor"></path>
        </svg>

        <Switch
          checked={isDark}
          onChange={(e) => setTheme(e.target.checked ? 'dark' : 'light')}
        />

        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
          <path d="M12 1.992a10 10 0 1 0 9.236 13.838c.341 -.82 -.476 -1.644 -1.298 -1.31a6.5 6.5 0 0 1 -6.864 -10.787l.077 -.08c.551 -.63 .113 -1.653 -.758 -1.653h-.266l-.068 -.006l-.06 -.002z" strokeWidth="0" fill="currentColor"></path>
        </svg>
      </div>
    </main>
  )
}
