import { Button, Card, Divider, Dropdown, Grid, Modal, Spacer, Text } from '@nextui-org/react'
import { open, save } from '@tauri-apps/api/dialog'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

import { useTheme as useNextTheme } from 'next-themes'
import { Switch, useTheme } from '@nextui-org/react'
import { NewIcon } from '@/components/icons/NewIcon'
import { OpenIcon } from '@/components/icons/OpenIcon'
import { SunIcon } from '@/components/icons/SunIcon'
import { MoonIcon } from '@/components/icons/MoonIcon'
import { SettingsIcon } from '@/components/icons/SettingsIcon'
import React, { useContext, useEffect, useState } from 'react'
import { LanguageIcon } from '@/components/icons/LanguageIcon'
import { PaintIcon } from '@/components/icons/PaintIcon'
import { SettingsContext } from '@/components/SettingsContext'

// @ts-ignore
export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, [
        'common'
      ], null, ['de'])),
      // Will be passed to the page component as props
    },
  }
}

export default function Home() {
  const [settingsModal, setSettingsModal] = useState(false)
  const handler = () => setSettingsModal(true)
  const closeHandler = () => setSettingsModal(false)

  // Theme
  const { setTheme } = useNextTheme()
  const { isDark, type } = useTheme()

  const { t, i18n } = useTranslation('common')
  const router = useRouter()

  const settings = useContext(SettingsContext)

  useEffect(() => {
    let conf = settings.config
    changeLanguage(conf.language)
    setTheme(conf.theme)
  }, [])

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
  }

  function changeLanguage(lang: string) {
    i18n.changeLanguage(lang)

    router.push({
      pathname: router.pathname,
      query: router.query
    }, router.asPath, {
      locale: 'de',
      scroll: false,
      shallow: true
    })
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

  const [selectedLanguage, setSelectedLanguage] = useState("en")
  const selectedValue = React.useMemo(
    () => {
      let lang = Array.from(selectedLanguage).join("")
      console.log("Lang: ", lang);
                
      let oldConfig = settings.config
      oldConfig.language = lang
      // settings.updateConfig(oldConfig)

      // changeLanguage(selectedLanguage.toString())
      
      switch (lang) {
        case "de":
          return "Deutsch"
          break
        case "en":
          return "English"
          break
      }
    },
    [selectedLanguage]
  );

  return (
    <main className="min-h-screen justify-center">
      <div className="main flex flex-col justify-center content-center p-24">
        <div className="flex items-baseline">
          <Text h1 className="me-6">{t("app_name")}</Text>
          <Text h5>pre-v1.0</Text>
        </div>

        <Grid.Container gap={8} justify="center">
          <Grid xs={6}>
            <Card>
              <Link href="#" onClick={newProject}>
                <Card.Body className="flex justify-items">
                  <NewIcon height={36} width={36} />

                  <Text>{t("project_new")}</Text>
                </Card.Body>
              </Link>
            </Card>
          </Grid>
          <Grid xs={6}>
            <Card>
              <Link href='' onClick={openProject}>
                <Card.Body className="flex justify-items">
                  <OpenIcon height={36} width={36} />
                  <Text>{t("project_open")}</Text>
                </Card.Body>
              </Link>
            </Card>
          </Grid>
          <Grid>
            <Button
              ghost
              onPress={handler}
              icon={<SettingsIcon />}
            >{t("settings")}</Button>


          </Grid>
        </Grid.Container>
      </div>

      <Modal
        closeButton
        open={settingsModal}
        onClose={closeHandler}
      >
        <Modal.Header>
          <Text h1 size={18}>
            {t("settings")}
          </Text>
        </Modal.Header>
        <Modal.Body>
          <div className="flex gap-2">
            <LanguageIcon />
            <Text>{t("settings_modal.language")}</Text>
          </div>
          <Dropdown>
            <Dropdown.Button flat>{ selectedValue }</Dropdown.Button>
            <Dropdown.Menu
              disallowEmptySelection
              selectionMode="single"
              selectedKeys={selectedLanguage}
              onSelectionChange={setSelectedLanguage}
            >
              <Dropdown.Item key="en">English</Dropdown.Item>
              <Dropdown.Item key="de">Deutsch</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>

          <Spacer y={.1} />
          <Divider />
          <Spacer y={.1} />

          <div className="flex gap-2">
            <PaintIcon />
            <Text>{t("settings_modal.theme")}</Text>
          </div>
          <div className="flex justify-center items-center gap-4">
            <SunIcon height={36} width={36} />

            <Switch
              checked={isDark}
              onChange={(e) => setTheme(e.target.checked ? 'dark' : 'light')}
            />

            <MoonIcon height={36} width={36} />
          </div>
        </Modal.Body>
      </Modal>
    </main>
  )
}
