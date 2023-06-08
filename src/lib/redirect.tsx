import { useContext, useEffect } from 'react'
import { NextRouter, useRouter } from 'next/router'
import { I18n } from 'next-i18next'
import { SettingsContext } from '@/components/SettingsContext'

export const getTranslatedPath = (path: string, currentPath: string, lang: I18n) => {
    if (path.startsWith('/' + lang) && currentPath === '/404') { // prevent endless loop
        return '/' + lang + currentPath
    }
    return '/' + lang.language + path
}

export const useRedirect = (to: string | null) => {
    const router = useRouter()
    const settings = useContext(SettingsContext)

    // If we pass null as destination, we just override it with '/[current language]/'
    // which should hit our main index.
    to = to || router.asPath

    useEffect(() => {
    const detectedLng = settings.config.language
    if (to!.startsWith('/' + detectedLng) && router.route === '/404') { // prevent endless loop
        router.replace('/' + detectedLng + router.route)
        return
    }

    router.replace('/' + detectedLng + to)
    })

    return <></>
};

export const Redirect = () => {
    useRedirect(null)
    return <></>
}

// eslint-disable-next-line react/display-name
export const getRedirect = (to: any) => () => {
    useRedirect(to)
    return <></>
}