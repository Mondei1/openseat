import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";

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
  const { t } = useTranslation('common');

  return (
    <>
      <div className="flex min-h-screen flex-col justify-center content-center p-24">
        <h1>{t("setup_welcome")}</h1>
      </div>
    </>
  )
}