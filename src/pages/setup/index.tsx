import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import { Button, Input, Loading, Spacer, Text } from "@nextui-org/react";
import { useState } from "react";

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

export default function Router() {
  const { t } = useTranslation('common')
  const router = useRouter()
  const { databasePath } = router.query

  let [isNext, setNext] = useState(false)

  function setupDatabase() {
    setNext(true);
  }

  return (
    <div className="flex min-h-screen flex-col content-center p-24">
      <h1>{t("setup.welcome")}</h1>
      <p>Saving at: {databasePath}</p>

      <Spacer y={3}></Spacer>
      <Input
        clearable
        bordered
        underlined
        labelPlaceholder={t("setup.plan_name")!}
        initialValue={t("setup.initial_name")!}
        color="primary"
      />

      <Spacer y={1.5}></Spacer>
      <Text>{t("setup.select_schematic_label")}</Text>
      <div className="w-96 mt-3">
        <Button>
          <svg className="p-2" width="36" height="36" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
            <path d="M8.813 11.612c.457 -.38 .918 -.38 1.386 .011l.108 .098l4.986 4.986l.094 .083a1 1 0 0 0 1.403 -1.403l-.083 -.094l-1.292 -1.293l.292 -.293l.106 -.095c.457 -.38 .918 -.38 1.386 .011l.108 .098l4.674 4.675a4 4 0 0 1 -3.775 3.599l-.206 .005h-12a4 4 0 0 1 -3.98 -3.603l6.687 -6.69l.106 -.095zm9.187 -9.612a4 4 0 0 1 3.995 3.8l.005 .2v9.585l-3.293 -3.292l-.15 -.137c-1.256 -1.095 -2.85 -1.097 -4.096 -.017l-.154 .14l-.307 .306l-2.293 -2.292l-.15 -.137c-1.256 -1.095 -2.85 -1.097 -4.096 -.017l-.154 .14l-5.307 5.306v-9.585a4 4 0 0 1 3.8 -3.995l.2 -.005h12zm-2.99 5l-.127 .007a1 1 0 0 0 0 1.986l.117 .007l.127 -.007a1 1 0 0 0 0 -1.986l-.117 -.007z" strokeWidth="0" fill="currentColor"></path>
          </svg>

          <Text>{t("setup.select_schematic")} (.PNG)</Text>
        </Button>
      </div>

      <Spacer y={4}></Spacer>
      {!isNext &&
        <Button color="gradient" auto onPress={setupDatabase}>
          {t("next")}
        </Button>
      }

      {isNext &&
        <Button disabled auto bordered color="gradient" css={{ px: "$13" }}>
          <Loading color="currentColor" size="sm" />
        </Button>
      }
    </div>
  )
}